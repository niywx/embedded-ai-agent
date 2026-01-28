#!/usr/bin/env pwsh
# ==============================================================================
# PDF 原理图处理脚本 (PowerShell)
# ==============================================================================
# 功能：将 PDF 原理图转换为图片，然后运行代码生成
# 使用：.\process_pdf_schematic.ps1 <datasheet.pdf> <schematic.pdf> <instruction>
# ==============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$DatasheetPath,
    
    [Parameter(Mandatory=$true)]
    [string]$SchematicPath,
    
    [Parameter(Mandatory=$false)]
    [string]$Instruction = "初始化所有 GPIO"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PDF 原理图处理脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查文件是否存在
if (-not (Test-Path $DatasheetPath)) {
    Write-Host "❌ 错误：找不到 Datasheet 文件: $DatasheetPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $SchematicPath)) {
    Write-Host "❌ 错误：找不到 Schematic 文件: $SchematicPath" -ForegroundColor Red
    exit 1
}

# 检查原理图是否为 PDF
$schematicExt = [System.IO.Path]::GetExtension($SchematicPath).ToLower()

if ($schematicExt -eq ".pdf") {
    Write-Host "📄 检测到 PDF 格式的原理图" -ForegroundColor Yellow
    Write-Host "正在转换为图片格式..." -ForegroundColor Yellow
    Write-Host ""
    
    # 生成输出图片路径
    $schematicDir = Split-Path $SchematicPath -Parent
    $schematicName = [System.IO.Path]::GetFileNameWithoutExtension($SchematicPath)
    $outputImage = Join-Path $schematicDir "$schematicName.png"
    
    # 方法 1：尝试使用 ImageMagick
    Write-Host "尝试使用 ImageMagick 转换..." -ForegroundColor Cyan
    $magickCmd = Get-Command magick -ErrorAction SilentlyContinue
    
    if ($magickCmd) {
        Write-Host "✓ 找到 ImageMagick，开始转换..." -ForegroundColor Green
        & magick convert -density 300 $SchematicPath -quality 100 $outputImage
        
        if ($LASTEXITCODE -eq 0 -and (Test-Path $outputImage)) {
            Write-Host "✓ 转换成功: $outputImage" -ForegroundColor Green
            $SchematicPath = $outputImage
        } else {
            Write-Host "⚠️ ImageMagick 转换失败" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ 未找到 ImageMagick" -ForegroundColor Yellow
        Write-Host "请安装 ImageMagick: https://imagemagick.org/script/download.php" -ForegroundColor Yellow
    }
    
    # 方法 2：尝试使用 Ghostscript
    if (-not (Test-Path $outputImage)) {
        Write-Host ""
        Write-Host "尝试使用 Ghostscript 转换..." -ForegroundColor Cyan
        $gsCmd = Get-Command gswin64c -ErrorAction SilentlyContinue
        
        if ($gsCmd) {
            Write-Host "✓ 找到 Ghostscript，开始转换..." -ForegroundColor Green
            & gswin64c -dNOPAUSE -dBATCH -sDEVICE=png16m -r300 "-sOutputFile=$outputImage" $SchematicPath
            
            if ($LASTEXITCODE -eq 0 -and (Test-Path $outputImage)) {
                Write-Host "✓ 转换成功: $outputImage" -ForegroundColor Green
                $SchematicPath = $outputImage
            } else {
                Write-Host "⚠️ Ghostscript 转换失败" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⚠️ 未找到 Ghostscript" -ForegroundColor Yellow
            Write-Host "请安装 Ghostscript: https://www.ghostscript.com/download/gsdnld.html" -ForegroundColor Yellow
        }
    }
    
    # 如果转换失败，提供替代方案
    if (-not (Test-Path $outputImage)) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host "⚠️ 自动转换失败，提供以下替代方案：" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "方案 1: 安装转换工具" -ForegroundColor Cyan
        Write-Host "  - ImageMagick: https://imagemagick.org/script/download.php#windows" -ForegroundColor White
        Write-Host "  - Ghostscript: https://www.ghostscript.com/download/gsdnld.html" -ForegroundColor White
        Write-Host ""
        Write-Host "方案 2: 在线转换" -ForegroundColor Cyan
        Write-Host "  - https://www.ilovepdf.com/pdf_to_jpg" -ForegroundColor White
        Write-Host "  - https://convertio.co/zh/pdf-png/" -ForegroundColor White
        Write-Host ""
        Write-Host "方案 3: 直接使用 PDF（文本提取模式）" -ForegroundColor Cyan
        Write-Host "  继续使用 PDF 格式，系统将提取文本内容进行分析" -ForegroundColor White
        Write-Host ""
        
        # 询问是否继续
        $continue = Read-Host "是否继续使用 PDF 文本提取模式？(Y/N)"
        if ($continue -ne "Y" -and $continue -ne "y") {
            Write-Host "已取消" -ForegroundColor Yellow
            exit 0
        }
    }
    
    Write-Host ""
}

# 运行代码生成
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "开始生成代码" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Datasheet: $DatasheetPath" -ForegroundColor White
Write-Host "Schematic: $SchematicPath" -ForegroundColor White
Write-Host "Instruction: $Instruction" -ForegroundColor White
Write-Host ""

# 执行命令
node src/cli.js --datasheet $DatasheetPath --schematic $SchematicPath --instruction $Instruction

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ 代码生成成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "输出文件：out/generated_code.c" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ 代码生成失败" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "请检查日志输出" -ForegroundColor White
}
