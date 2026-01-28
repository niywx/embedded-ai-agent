# 完整的文件上传测试脚本
# 使用实际的 BF7615CMXX.pdf 和 Schematic Prints.jpg
# Usage: .\test_file_upload.ps1

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║          🧪 API File Upload Test - Real Files                 ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 获取 ngrok 公网地址
Write-Host "[1/6] Getting ngrok public URL..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 3 -ErrorAction Stop
    if ($response.tunnels -and $response.tunnels.Count -gt 0) {
        $publicUrl = $response.tunnels[0].public_url
        Write-Host "   ✓ Public URL: $publicUrl" -ForegroundColor Green
    } else {
        Write-Host "   ✗ No active ngrok tunnels" -ForegroundColor Red
        Write-Host "   Tip: Run .\start_services.ps1 first" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   ✗ Cannot get ngrok URL. Is ngrok running?" -ForegroundColor Red
    exit 1
}

# 检查文件是否存在
Write-Host ""
Write-Host "[2/6] Checking test files..." -ForegroundColor Yellow

$datasheetPath = "f:\LLM4EDA\公司文件\demo generation\BF7615CMXX.pdf"
$schematicPath = "f:\LLM4EDA\公司文件\demo generation\Schematic Prints.jpg"

if (Test-Path $datasheetPath) {
    $datasheetSize = (Get-Item $datasheetPath).Length / 1KB
    Write-Host "   ✓ Datasheet: BF7615CMXX.pdf ($([math]::Round($datasheetSize, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "   ✗ Datasheet not found: $datasheetPath" -ForegroundColor Red
    exit 1
}

if (Test-Path $schematicPath) {
    $schematicSize = (Get-Item $schematicPath).Length / 1KB
    Write-Host "   ✓ Schematic: Schematic Prints.jpg ($([math]::Round($schematicSize, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "   ✗ Schematic not found: $schematicPath" -ForegroundColor Red
    exit 1
}

# 准备请求
Write-Host ""
Write-Host "[3/6] Preparing API request..." -ForegroundColor Yellow

$headers = @{
    "ngrok-skip-browser-warning" = "true"
}

$instruction = @"
根据 BF7615CMXX 芯片数据手册和原理图，生成以下功能的初始化代码：

1. GPIO 配置：
   - 配置所有引脚为正确的功能模式
   - 根据原理图设置输入/输出方向
   - 配置上拉/下拉电阻

2. 时钟配置：
   - 系统时钟初始化
   - 外设时钟使能

3. 外设初始化：
   - UART 通信配置
   - I2C/SPI 接口配置（如果有）
   - ADC/DAC 配置（如果有）

请生成符合 MISRA C 标准的代码，并添加详细注释。
"@

Write-Host "   ✓ Instruction prepared ($($ instruction.Length) characters)" -ForegroundColor Green

# 准备上传文件
$form = @{
    datasheet = Get-Item -Path $datasheetPath
    schematic = Get-Item -Path $schematicPath
    instruction = $instruction
}

Write-Host "   ✓ Files ready for upload" -ForegroundColor Green

# 发送请求
Write-Host ""
Write-Host "[4/6] Uploading files and generating code..." -ForegroundColor Yellow
Write-Host "   ⏳ This may take 10-30 seconds..." -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date

try {
    $result = Invoke-RestMethod -Uri "$publicUrl/api/v1/generate" `
        -Method Post `
        -Form $form `
        -Headers $headers `
        -TimeoutSec 120
    
    $endTime = Get-Date
    $elapsed = ($endTime - $startTime).TotalSeconds
    
    Write-Host "   ✓ Request completed in $([math]::Round($elapsed, 2)) seconds" -ForegroundColor Green
    
} catch {
    Write-Host "   ✗ Request failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}

# 分析结果
Write-Host ""
Write-Host "[5/6] Analyzing results..." -ForegroundColor Yellow

if ($result.status -eq "success") {
    Write-Host "   ✓ Status: SUCCESS" -ForegroundColor Green
    Write-Host ""
    Write-Host "   📊 Metadata:" -ForegroundColor Cyan
    Write-Host "      • Datasheet: $($result.metadata.datasheet_name)" -ForegroundColor Gray
    Write-Host "      • Schematic: $($result.metadata.schematic_name)" -ForegroundColor Gray
    Write-Host "      • Registers extracted: $($result.metadata.registers_count)" -ForegroundColor Gray
    Write-Host "      • Pin mappings: $($result.metadata.pin_mappings_count)" -ForegroundColor Gray
    Write-Host "      • Processing time: $($result.metadata.processing_time_ms) ms" -ForegroundColor Gray
    Write-Host "      • Output file: $($result.metadata.output_filename)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   📝 Generated Code:" -ForegroundColor Cyan
    Write-Host "      • Length: $($result.generated_code.Length) characters" -ForegroundColor Gray
    Write-Host "      • Lines: $(($result.generated_code -split "`n").Count)" -ForegroundColor Gray
} else {
    Write-Host "   ✗ Status: FAILED" -ForegroundColor Red
    Write-Host "   Message: $($result.message)" -ForegroundColor Red
    exit 1
}

# 保存生成的代码
Write-Host ""
Write-Host "[6/6] Saving generated code..." -ForegroundColor Yellow

$outputDir = "f:\LLM4EDA\公司文件\demo generation\embedded-ai-agent\out"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = Join-Path $outputDir "BF7615_generated_$timestamp.c"

try {
    # 确保输出目录存在
    if (!(Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    
    # 保存代码
    $result.generated_code | Out-File -FilePath $outputFile -Encoding UTF8
    
    Write-Host "   ✓ Code saved to: $outputFile" -ForegroundColor Green
    
    # 也保存元数据
    $metadataFile = Join-Path $outputDir "BF7615_metadata_$timestamp.json"
    $result.metadata | ConvertTo-Json -Depth 10 | Out-File -FilePath $metadataFile -Encoding UTF8
    Write-Host "   ✓ Metadata saved to: $metadataFile" -ForegroundColor Green
    
} catch {
    Write-Host "   ✗ Failed to save file: $($_.Exception.Message)" -ForegroundColor Red
}

# 显示代码预览
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║                  ✅ Test Completed Successfully!               ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📄 Generated Code Preview (first 50 lines):" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$codeLines = $result.generated_code -split "`n"
$previewLines = $codeLines[0..([Math]::Min(49, $codeLines.Count - 1))]
$previewLines | ForEach-Object { Write-Host $_ -ForegroundColor White }

if ($codeLines.Count -gt 50) {
    Write-Host ""
    Write-Host "... ($($ codeLines.Count - 50) more lines)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Review the generated code: $outputFile" -ForegroundColor Gray
Write-Host "   2. Check metadata: $metadataFile" -ForegroundColor Gray
Write-Host "   3. Integrate into your project" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Public API is working perfectly with real files!" -ForegroundColor Green
Write-Host ""
