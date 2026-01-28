# =============================================================================
# Start API Server Only
# =============================================================================
# Description: Starts only the API server without ngrok
# Usage: .\start_api_only.ps1
# =============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting API Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if port 8080 is in use
$port = 8080
$portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "[WARNING] Port $port is already in use" -ForegroundColor Yellow
    Write-Host "Attempting to stop the process..." -ForegroundColor Yellow
    
    $processId = $portInUse.OwningProcess | Select-Object -First 1
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    
    Write-Host "[INFO] Process stopped" -ForegroundColor Green
}

# Start API Server
Write-Host "[INFO] Starting API Server on port $port..." -ForegroundColor Green

try {
    node api_server.js
}
catch {
    Write-Host ""
    Write-Host "[ERROR] Failed to start API server: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host "1. Make sure Node.js is installed: node --version" -ForegroundColor White
    Write-Host "2. Install dependencies: npm install" -ForegroundColor White
    Write-Host "3. Check if .env file exists and has valid QWEN_API_KEY" -ForegroundColor White
    Write-Host "4. Check api_server.js for syntax errors" -ForegroundColor White
    exit 1
}
