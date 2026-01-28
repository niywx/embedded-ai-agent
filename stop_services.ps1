# Stop API server and ngrok
# Usage: .\stop_services.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stopping All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$stoppedAny = $false

# Stop ngrok
Write-Host "Checking ngrok processes..." -ForegroundColor Yellow
$ngrokProcesses = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($ngrokProcesses) {
    foreach ($proc in $ngrokProcesses) {
        Write-Host "   Stopping ngrok (PID: $($proc.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        $stoppedAny = $true
    }
    Write-Host "   [OK] ngrok stopped" -ForegroundColor Green
} else {
    Write-Host "   [INFO] ngrok not running" -ForegroundColor Gray
}

# Stop process using port 8080 (usually Node.js API server)
Write-Host ""
Write-Host "Checking port 8080 usage..." -ForegroundColor Yellow
$port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($port8080) {
    $processId = $port8080[0].OwningProcess
    $processName = (Get-Process -Id $processId -ErrorAction SilentlyContinue).ProcessName
    Write-Host "   Stopping process $processName (PID: $processId)..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Write-Host "   [OK] API server stopped" -ForegroundColor Green
    $stoppedAny = $true
} else {
    Write-Host "   [INFO] Port 8080 not in use" -ForegroundColor Gray
}

Write-Host ""
if ($stoppedAny) {
    Write-Host "[OK] All services stopped" -ForegroundColor Green
} else {
    Write-Host "[INFO] No services were running" -ForegroundColor Gray
}
Write-Host ""