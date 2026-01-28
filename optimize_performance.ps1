# =============================================================================
# Performance Optimization Script
# =============================================================================
# Description: Apply recommended performance optimizations automatically
# Impact: Reduce generation time by 35-40%
# =============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Performance Optimization Wizard" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$qwenApiPath = "src\qwen_api.js"

# Check if file exists
if (-not (Test-Path $qwenApiPath)) {
    Write-Host "[ERROR] Cannot find $qwenApiPath" -ForegroundColor Red
    exit 1
}

Write-Host "[1/5] Reading current configuration..." -ForegroundColor Green
$content = Get-Content $qwenApiPath -Raw -Encoding UTF8

# Backup
Write-Host "[2/5] Creating backup..." -ForegroundColor Green
$backupPath = "$qwenApiPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item $qwenApiPath $backupPath
Write-Host "   Backup saved to: $backupPath" -ForegroundColor Gray

# Display current config
Write-Host ""
Write-Host "[3/5] Current Configuration:" -ForegroundColor Yellow
if ($content -match "const TEXT_MODEL = '([^']+)'") {
    Write-Host "   TEXT_MODEL: $($matches[1])" -ForegroundColor Gray
}
if ($content -match "const VISION_MODEL = '([^']+)'") {
    Write-Host "   VISION_MODEL: $($matches[1])" -ForegroundColor Gray
}
if ($content -match "maxTokens = (\d+)") {
    Write-Host "   maxTokens: $($matches[1])" -ForegroundColor Gray
}

# Ask user for optimization level
Write-Host ""
Write-Host "Select optimization level:" -ForegroundColor Cyan
Write-Host "  [1] Balanced (Recommended) - 35-40% faster, good quality" -ForegroundColor White
Write-Host "  [2] Fast - 50-60% faster, moderate quality" -ForegroundColor White
Write-Host "  [3] Ultra Fast - 60-70% faster, basic quality" -ForegroundColor White
Write-Host "  [4] Custom" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "[4/5] Applying BALANCED optimization..." -ForegroundColor Green
        $content = $content -replace "const TEXT_MODEL = '[^']*'", "const TEXT_MODEL = 'qwen-turbo'"
        $content = $content -replace "const VISION_MODEL = '[^']*'", "const VISION_MODEL = 'qwen-vl-plus'"
        $content = $content -replace "maxTokens = \d+", "maxTokens = 1500"
        Write-Host "   TEXT_MODEL: qwen-plus -> qwen-turbo" -ForegroundColor Gray
        Write-Host "   VISION_MODEL: qwen-vl-max -> qwen-vl-plus" -ForegroundColor Gray
        Write-Host "   maxTokens: 2000 -> 1500" -ForegroundColor Gray
    }
    "2" {
        Write-Host ""
        Write-Host "[4/5] Applying FAST optimization..." -ForegroundColor Green
        $content = $content -replace "const TEXT_MODEL = '[^']*'", "const TEXT_MODEL = 'qwen-turbo'"
        $content = $content -replace "const VISION_MODEL = '[^']*'", "const VISION_MODEL = 'qwen-vl-plus'"
        $content = $content -replace "maxTokens = \d+", "maxTokens = 1200"
        $content = $content -replace "temperature = [0-9.]+", "temperature = 0.85"
        Write-Host "   TEXT_MODEL: -> qwen-turbo" -ForegroundColor Gray
        Write-Host "   VISION_MODEL: -> qwen-vl-plus" -ForegroundColor Gray
        Write-Host "   maxTokens: -> 1200" -ForegroundColor Gray
        Write-Host "   temperature: -> 0.85" -ForegroundColor Gray
    }
    "3" {
        Write-Host ""
        Write-Host "[4/5] Applying ULTRA FAST optimization..." -ForegroundColor Green
        $content = $content -replace "const TEXT_MODEL = '[^']*'", "const TEXT_MODEL = 'qwen-turbo'"
        $content = $content -replace "const VISION_MODEL = '[^']*'", "const VISION_MODEL = 'qwen-vl-plus'"
        $content = $content -replace "maxTokens = \d+", "maxTokens = 1000"
        $content = $content -replace "temperature = [0-9.]+", "temperature = 0.9"
        Write-Host "   TEXT_MODEL: -> qwen-turbo" -ForegroundColor Gray
        Write-Host "   VISION_MODEL: -> qwen-vl-plus" -ForegroundColor Gray
        Write-Host "   maxTokens: -> 1000" -ForegroundColor Gray
        Write-Host "   temperature: -> 0.9" -ForegroundColor Gray
    }
    "4" {
        Write-Host ""
        Write-Host "Custom configuration:" -ForegroundColor Cyan
        $textModel = Read-Host "TEXT_MODEL (qwen-turbo/qwen-plus/qwen-max)"
        $visionModel = Read-Host "VISION_MODEL (qwen-vl-plus/qwen-vl-max)"
        $maxTokens = Read-Host "maxTokens (1000-3000)"
        
        $content = $content -replace "const TEXT_MODEL = '[^']*'", "const TEXT_MODEL = '$textModel'"
        $content = $content -replace "const VISION_MODEL = '[^']*'", "const VISION_MODEL = '$visionModel'"
        $content = $content -replace "maxTokens = \d+", "maxTokens = $maxTokens"
        
        Write-Host "[4/5] Applying CUSTOM optimization..." -ForegroundColor Green
        Write-Host "   TEXT_MODEL: -> $textModel" -ForegroundColor Gray
        Write-Host "   VISION_MODEL: -> $visionModel" -ForegroundColor Gray
        Write-Host "   maxTokens: -> $maxTokens" -ForegroundColor Gray
    }
    default {
        Write-Host "[ERROR] Invalid choice" -ForegroundColor Red
        exit 1
    }
}

# Save
Write-Host ""
Write-Host "[5/5] Saving optimized configuration..." -ForegroundColor Green
Set-Content $qwenApiPath $content -Encoding UTF8
Write-Host "   Configuration saved successfully" -ForegroundColor Gray

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Optimization Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Expected Performance Improvement:" -ForegroundColor Cyan
switch ($choice) {
    "1" { 
        Write-Host "   • Generation time: 130s -> 80-90s" -ForegroundColor White
        Write-Host "   • Speed improvement: 35-40% faster" -ForegroundColor White
        Write-Host "   • Code quality: Good (⭐⭐⭐)" -ForegroundColor White
    }
    "2" { 
        Write-Host "   • Generation time: 130s -> 60-70s" -ForegroundColor White
        Write-Host "   • Speed improvement: 50-60% faster" -ForegroundColor White
        Write-Host "   • Code quality: Moderate (⭐⭐)" -ForegroundColor White
    }
    "3" { 
        Write-Host "   • Generation time: 130s -> 40-50s" -ForegroundColor White
        Write-Host "   • Speed improvement: 60-70% faster" -ForegroundColor White
        Write-Host "   • Code quality: Basic (⭐)" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart API server:" -ForegroundColor White
Write-Host "      node api_server.js" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Test performance:" -ForegroundColor White
Write-Host "      node test_upload.mjs" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Restore backup if needed:" -ForegroundColor White
Write-Host "      Copy-Item '$backupPath' '$qwenApiPath' -Force" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Additional Tips:" -ForegroundColor Cyan
Write-Host "   • Use PNG/JPG schematic instead of PDF (saves 30s)" -ForegroundColor White
Write-Host "   • Keep file sizes under 5MB" -ForegroundColor White
Write-Host "   • Use concise instructions" -ForegroundColor White
Write-Host ""
Write-Host "📖 For more details, see: PERFORMANCE_OPTIMIZATION.md" -ForegroundColor Gray
Write-Host ""
