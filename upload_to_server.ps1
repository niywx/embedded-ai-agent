# ============================================================================
# 嵌入式AI代码生成系统 - Windows上传脚本
# 用途: 从Windows本地上传项目到Linux服务器
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerUser,
    
    [Parameter(Mandatory=$false)]
    [string]$ServerHost,
    
    [Parameter(Mandatory=$false)]
    [string]$ServerPath = "~/embedded-ai-agent",
    
    [Parameter(Mandatory=$false)]
    [switch]$UseRsync
)

$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-ColorOutput {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [Parameter(Mandatory=$false)]
        [ValidateSet('Info', 'Success', 'Warning', 'Error')]
        [string]$Type = 'Info'
    )
    
    switch ($Type) {
        'Info'    { Write-Host "[INFO] $Message" -ForegroundColor Cyan }
        'Success' { Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
        'Warning' { Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
        'Error'   { Write-Host "[ERROR] $Message" -ForegroundColor Red }
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Blue
Write-Host "  嵌入式AI代码生成系统 - 上传到服务器" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# ============================================================================
# 1. 获取服务器信息
# ============================================================================

if (-not $ServerUser) {
    $ServerUser = Read-Host "请输入服务器用户名 (例: ubuntu, root)"
}

if (-not $ServerHost) {
    $ServerHost = Read-Host "请输入服务器地址 (例: 192.168.1.100 或 server.example.com)"
}

Write-ColorOutput "服务器信息: $ServerUser@$ServerHost" "Info"
Write-ColorOutput "目标路径: $ServerPath" "Info"

# ============================================================================
# 2. 检查本地环境
# ============================================================================

Write-ColorOutput "检查本地环境..." "Info"

$ProjectDir = $PSScriptRoot
Write-ColorOutput "项目目录: $ProjectDir" "Info"

# 检查必要文件
$requiredFiles = @(
    "package.json",
    "api_server.js",
    "deploy.sh",
    "health_check.sh"
)

foreach ($file in $requiredFiles) {
    $filePath = Join-Path $ProjectDir $file
    if (-not (Test-Path $filePath)) {
        Write-ColorOutput "缺少必要文件: $file" "Error"
        exit 1
    }
}

Write-ColorOutput "本地文件检查通过" "Success"

# ============================================================================
# 3. 检查连接工具
# ============================================================================

Write-ColorOutput "检查上传工具..." "Info"

$hasScp = Get-Command scp -ErrorAction SilentlyContinue
$hasRsync = Get-Command rsync -ErrorAction SilentlyContinue

if ($UseRsync) {
    if (-not $hasRsync) {
        Write-ColorOutput "rsync 未安装，将使用 scp 代替" "Warning"
        $UseRsync = $false
    }
} else {
    if (-not $hasScp) {
        Write-ColorOutput "scp 未安装" "Error"
        Write-Host "请安装 Git for Windows 或 OpenSSH" -ForegroundColor Yellow
        Write-Host "下载地址: https://git-scm.com/download/win" -ForegroundColor Yellow
        exit 1
    }
}

# ============================================================================
# 4. 测试服务器连接
# ============================================================================

Write-ColorOutput "测试服务器连接..." "Info"

$sshTest = & ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$ServerUser@$ServerHost" "echo 'Connection OK'" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput "无法连接到服务器" "Error"
    Write-ColorOutput $sshTest "Error"
    Write-Host ""
    Write-Host "请确保:" -ForegroundColor Yellow
    Write-Host "  1. 服务器地址正确" -ForegroundColor Yellow
    Write-Host "  2. SSH 服务运行中" -ForegroundColor Yellow
    Write-Host "  3. 防火墙允许 SSH 连接" -ForegroundColor Yellow
    Write-Host "  4. 已配置 SSH 密钥或可输入密码" -ForegroundColor Yellow
    exit 1
}

Write-ColorOutput "服务器连接正常" "Success"

# ============================================================================
# 5. 创建排除列表
# ============================================================================

Write-ColorOutput "准备上传文件..." "Info"

# 创建临时排除文件列表
$excludeList = @(
    "node_modules",
    ".git",
    ".env",
    "temp/*",
    "out/*",
    "logs/*",
    ".restore_backup_*",
    "*.log",
    ".DS_Store",
    "Thumbs.db"
)

$excludeFile = Join-Path $env:TEMP "embedded-ai-exclude.txt"
$excludeList | Out-File -FilePath $excludeFile -Encoding utf8

# ============================================================================
# 6. 上传文件
# ============================================================================

Write-Host ""
Write-ColorOutput "开始上传文件到服务器..." "Info"
Write-ColorOutput "这可能需要几分钟，请耐心等待..." "Warning"
Write-Host ""

$uploadSuccess = $false

if ($UseRsync) {
    # 使用 rsync (增量同步)
    Write-ColorOutput "使用 rsync 增量同步..." "Info"
    
    $rsyncArgs = @(
        "-avz",
        "--progress",
        "--delete",
        "--exclude-from=$excludeFile",
        "$ProjectDir/",
        "${ServerUser}@${ServerHost}:${ServerPath}/"
    )
    
    & rsync $rsyncArgs
    $uploadSuccess = $LASTEXITCODE -eq 0
    
} else {
    # 使用 scp (完整上传)
    Write-ColorOutput "使用 scp 上传..." "Info"
    
    # 在服务器上创建目标目录
    & ssh "$ServerUser@$ServerHost" "mkdir -p $ServerPath"
    
    # 打包项目 (排除不需要的文件)
    $tempZip = Join-Path $env:TEMP "embedded-ai-upload.zip"
    
    Write-ColorOutput "打包项目文件..." "Info"
    
    # 使用 PowerShell 压缩 (排除指定目录)
    Add-Type -Assembly System.IO.Compression.FileSystem
    
    if (Test-Path $tempZip) {
        Remove-Item $tempZip -Force
    }
    
    # 创建临时目录并复制文件
    $tempDir = Join-Path $env:TEMP "embedded-ai-temp"
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    Copy-Item $ProjectDir $tempDir -Recurse -Force
    
    # 删除排除的目录
    Get-ChildItem $tempDir -Directory -Recurse | Where-Object { 
        $_.Name -in @('node_modules', '.git', 'temp', 'logs')
    } | Remove-Item -Recurse -Force
    
    # 压缩
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $tempZip)
    
    Write-ColorOutput "上传压缩包到服务器..." "Info"
    & scp -C $tempZip "${ServerUser}@${ServerHost}:${ServerPath}.zip"
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "在服务器上解压..." "Info"
        & ssh "$ServerUser@$ServerHost" @"
            unzip -q -o ${ServerPath}.zip -d ${ServerPath}_temp && \
            rm -rf $ServerPath && \
            mv ${ServerPath}_temp/* $ServerPath/ && \
            rmdir ${ServerPath}_temp && \
            rm ${ServerPath}.zip
"@
        $uploadSuccess = $LASTEXITCODE -eq 0
    }
    
    # 清理临时文件
    Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

# 清理临时排除文件
Remove-Item $excludeFile -Force -ErrorAction SilentlyContinue

# ============================================================================
# 7. 验证上传
# ============================================================================

if ($uploadSuccess) {
    Write-Host ""
    Write-ColorOutput "文件上传成功!" "Success"
    
    # 验证关键文件
    Write-ColorOutput "验证上传的文件..." "Info"
    
    $checkFiles = & ssh "$ServerUser@$ServerHost" @"
        cd $ServerPath && \
        ls -lh package.json api_server.js deploy.sh 2>/dev/null && \
        echo "Files OK" || echo "Files missing"
"@
    
    if ($checkFiles -match "Files OK") {
        Write-ColorOutput "文件验证通过" "Success"
    } else {
        Write-ColorOutput "部分文件可能缺失" "Warning"
    }
    
} else {
    Write-ColorOutput "文件上传失败" "Error"
    exit 1
}

# ============================================================================
# 8. 设置脚本权限
# ============================================================================

Write-ColorOutput "设置脚本执行权限..." "Info"

& ssh "$ServerUser@$ServerHost" @"
    cd $ServerPath && \
    chmod +x deploy.sh health_check.sh backup.sh restore.sh && \
    ls -lh *.sh
"@

# ============================================================================
# 9. 询问是否立即部署
# ============================================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  上传完成!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Write-Host "项目已上传到: $ServerUser@$ServerHost:$ServerPath" -ForegroundColor Cyan
Write-Host ""

$deploy = Read-Host "是否立即运行自动部署脚本? (y/N)"

if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-ColorOutput "开始自动部署..." "Info"
    Write-Host ""
    
    # 运行部署脚本
    & ssh -t "$ServerUser@$ServerHost" "cd $ServerPath && ./deploy.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-ColorOutput "部署完成!" "Success"
    } else {
        Write-ColorOutput "部署过程中出现错误" "Warning"
    }
    
} else {
    Write-Host ""
    Write-Host "手动部署步骤:" -ForegroundColor Yellow
    Write-Host "  1. SSH 连接到服务器:" -ForegroundColor White
    Write-Host "     ssh $ServerUser@$ServerHost" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. 进入项目目录:" -ForegroundColor White
    Write-Host "     cd $ServerPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. 运行部署脚本:" -ForegroundColor White
    Write-Host "     ./deploy.sh" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# 10. 显示后续步骤
# ============================================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Blue
Write-Host "  后续操作" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

Write-Host "SSH 连接命令:" -ForegroundColor Cyan
Write-Host "  ssh $ServerUser@$ServerHost" -ForegroundColor White
Write-Host ""

Write-Host "查看服务状态:" -ForegroundColor Cyan
Write-Host "  cd $ServerPath && ./health_check.sh" -ForegroundColor White
Write-Host ""

Write-Host "查看服务日志:" -ForegroundColor Cyan
Write-Host "  pm2 logs" -ForegroundColor White
Write-Host ""

Write-Host "API 测试地址:" -ForegroundColor Cyan
Write-Host "  http://${ServerHost}:8080/api/v1/health" -ForegroundColor White
Write-Host ""

Write-Host "详细文档:" -ForegroundColor Cyan
Write-Host "  cat QUICK_START.md" -ForegroundColor White
Write-Host "  cat DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host ""

Write-Host "============================================" -ForegroundColor Blue
Write-Host ""
