# 测试公网 API 访问
# Usage: .\test_public_api.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Testing Public API Access" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 获取 ngrok 公网地址
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 3 -ErrorAction Stop
    if ($response.tunnels -and $response.tunnels.Count -gt 0) {
        $publicUrl = $response.tunnels[0].public_url
        Write-Host "[INFO] Public URL: $publicUrl" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] No active ngrok tunnels" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Cannot get ngrok URL. Is ngrok running?" -ForegroundColor Red
    exit 1
}

$headers = @{"ngrok-skip-browser-warning"="true"}

# 测试 1: Health Check
Write-Host ""
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$publicUrl/api/v1/health" -Headers $headers
    Write-Host "  [OK] Status: $($health.status)" -ForegroundColor Green
    Write-Host "  [OK] Service: $($health.service)" -ForegroundColor Green
} catch {
    Write-Host "  [FAILED] Health check failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试 2: System Status
Write-Host ""
Write-Host "Test 2: System Status" -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "$publicUrl/api/v1/status" -Headers $headers
    Write-Host "  [OK] Qwen API: $($status.system.qwen_api)" -ForegroundColor Green
    Write-Host "  [OK] Node Version: $($status.system.node_version)" -ForegroundColor Green
} catch {
    Write-Host "  [FAILED] Status check failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试 3: API Documentation
Write-Host ""
Write-Host "Test 3: API Documentation" -ForegroundColor Yellow
try {
    $docs = Invoke-RestMethod -Uri "$publicUrl/api/v1/docs" -Headers $headers
    Write-Host "  [OK] API Version: $($docs.version)" -ForegroundColor Green
    Write-Host "  [OK] Available Endpoints: $($docs.endpoints.Count)" -ForegroundColor Green
} catch {
    Write-Host "  [FAILED] Documentation access failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试 4: 文件上传（如果有示例文件）
Write-Host ""
Write-Host "Test 4: File Upload (Optional)" -ForegroundColor Yellow
$exampleSchematic = ".\examples\sample_schematic.png"
if (Test-Path $exampleSchematic) {
    try {
        Write-Host "  [INFO] Found example schematic: $exampleSchematic" -ForegroundColor Gray
        
        $form = @{
            schematic = Get-Item -Path $exampleSchematic
            instruction = "测试代码生成功能"
        }
        
        Write-Host "  [INFO] Uploading file and generating code..." -ForegroundColor Gray
        $result = Invoke-RestMethod -Uri "$publicUrl/api/v1/generate" -Method Post -Form $form -Headers $headers
        
        Write-Host "  [OK] Code generated successfully!" -ForegroundColor Green
        Write-Host "  [OK] Processing time: $($result.metadata.processing_time_ms) ms" -ForegroundColor Green
        Write-Host "  [OK] Code length: $($result.generated_code.Length) characters" -ForegroundColor Green
    } catch {
        Write-Host "  [FAILED] File upload test failed" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  [SKIP] No example file found at: $exampleSchematic" -ForegroundColor Yellow
}

# 总结
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[SUCCESS] Your API is publicly accessible!" -ForegroundColor Green
Write-Host ""
Write-Host "Share this URL with others:" -ForegroundColor Yellow
Write-Host "  $publicUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Example usage:" -ForegroundColor Yellow
Write-Host '  curl -X POST "$publicUrl/api/v1/generate" \' -ForegroundColor Gray
Write-Host '    -H "ngrok-skip-browser-warning: true" \' -ForegroundColor Gray
Write-Host '    -F "datasheet=@datasheet.pdf" \' -ForegroundColor Gray
Write-Host '    -F "schematic=@schematic.png" \' -ForegroundColor Gray
Write-Host '    -F "instruction=生成初始化代码"' -ForegroundColor Gray
Write-Host ""
