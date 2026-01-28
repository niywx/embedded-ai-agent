# Startup script for API server and ngrok
# Usage: .\start_services.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Embedded AI Agent Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if services are already running
$port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($port8080) {
    Write-Host "[Warning] Port 8080 is already in use" -ForegroundColor Yellow
    Write-Host "Tip: Run .\stop_services.ps1 to stop existing services" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

$ngrokProcesses = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($ngrokProcesses) {
    Write-Host "[Warning] ngrok is already running" -ForegroundColor Yellow
    Write-Host "Tip: Run .\stop_services.ps1 to stop existing services" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Start API Server (with increased memory limit for large files)
Write-Host "1. Starting API Server (Port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node --max-old-space-size=4096 api_server.js" -WindowStyle Normal
Write-Host "   Waiting for API server to start..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Check if API server started successfully
$port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($port8080) {
    Write-Host "   [OK] API Server started successfully" -ForegroundColor Green
    Write-Host "   Local URL: http://localhost:8080" -ForegroundColor Cyan
} else {
    Write-Host "   [ERROR] API Server failed to start" -ForegroundColor Red
    Write-Host "   Please check if Node.js and dependencies are installed" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""

# Start ngrok
Write-Host "2. Starting ngrok tunnel..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\ngrok.exe http 8080" -WindowStyle Normal
Write-Host "   Waiting for ngrok tunnel to establish..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Check if ngrok started successfully
$ngrokProcesses = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($ngrokProcesses) {
    Write-Host "   [OK] ngrok started successfully" -ForegroundColor Green
    
    # Get public URL
    try {
        Start-Sleep -Seconds 2
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 5 -ErrorAction Stop
        if ($response.tunnels -and $response.tunnels.Count -gt 0) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  Services Started Successfully!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Public URL:" -ForegroundColor Cyan
            $response.tunnels | ForEach-Object {
                Write-Host "   $($_.public_url)" -ForegroundColor Yellow
            }
            Write-Host ""
            Write-Host "Management UI: http://localhost:4040" -ForegroundColor Cyan
            Write-Host "Local API: http://localhost:8080" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Available Endpoints:" -ForegroundColor Gray
            Write-Host "   /api/v1/health       - Health check" -ForegroundColor Gray
            Write-Host "   /api/v1/generate     - Generate code" -ForegroundColor Gray
            Write-Host "   /api/v1/parse        - Parse schematic" -ForegroundColor Gray
            Write-Host "   /api/v1/extract      - Extract registers" -ForegroundColor Gray
            Write-Host ""
            Write-Host "Test Command:" -ForegroundColor Green
            $publicUrl = $response.tunnels[0].public_url
            Write-Host "   $headers = @{"ngrok-skip-browser-warning"="true"}" -ForegroundColor Yellow
            Write-Host "   Invoke-RestMethod -Uri "$publicUrl/api/v1/health" -Headers $headers" -ForegroundColor Yellow
            Write-Host ""
        } else {
            Write-Host "   [Warning] ngrok tunnel not yet established, please wait..." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   [Warning] Cannot get public URL" -ForegroundColor Yellow
        Write-Host "   Tip: Run .\show_ngrok_url.ps1 in a few seconds" -ForegroundColor Gray
    }
} else {
    Write-Host "   [ERROR] ngrok failed to start" -ForegroundColor Red
    Write-Host "   Please check if ngrok.exe exists and authtoken is configured" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Management Commands:" -ForegroundColor Cyan
Write-Host "   Check status: .\check_services.ps1" -ForegroundColor Gray
Write-Host "   Show URL: .\show_ngrok_url.ps1" -ForegroundColor Gray
Write-Host "   Stop services: .\stop_services.ps1" -ForegroundColor Gray
Write-Host ""