# Show ngrok public URL
# Usage: .\show_ngrok_url.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ngrok Public URL Viewer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is running
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
    
    if ($response.tunnels.Count -gt 0) {
        $tunnel = $response.tunnels[0]
        $publicUrl = $tunnel.public_url
        
        Write-Host "[OK] Ngrok is running!" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Public Access URL" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "  $publicUrl" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Available API Endpoints:" -ForegroundColor Yellow
        Write-Host "  Health Check:  $publicUrl/api/v1/health" -ForegroundColor White
        Write-Host "  System Status: $publicUrl/api/v1/status" -ForegroundColor White
        Write-Host "  API Docs:      $publicUrl/api/v1/docs" -ForegroundColor White
        Write-Host "  Generate Code: POST $publicUrl/api/v1/generate" -ForegroundColor White
        Write-Host ""
        
        Write-Host "Management UI (view details):" -ForegroundColor Yellow
        Write-Host "  http://localhost:4040" -ForegroundColor White
        Write-Host ""
        
        Write-Host "Usage:" -ForegroundColor Yellow
        Write-Host "  1. Copy the public URL above" -ForegroundColor White
        Write-Host "  2. Share it with users who need access" -ForegroundColor White
        Write-Host "  3. They can access from anywhere" -ForegroundColor White
        Write-Host ""
        
        Write-Host "Important Notes:" -ForegroundColor Yellow
        Write-Host "  - Free version shows warning page on first visit (click 'Visit Site')" -ForegroundColor White
        Write-Host "  - Keep API server running (port 8080)" -ForegroundColor White
        Write-Host "  - Keep ngrok process running" -ForegroundColor White
        Write-Host "  - URL changes when ngrok restarts" -ForegroundColor White
        Write-Host ""
        
        # Test connection
        Write-Host "Testing connection..." -ForegroundColor Cyan
        try {
            $headers = @{"ngrok-skip-browser-warning"="true"}
            $healthCheck = Invoke-RestMethod -Uri "$publicUrl/api/v1/health" -Headers $headers -TimeoutSec 10
            Write-Host "[OK] Connection test successful! API is working" -ForegroundColor Green
            Write-Host ""
        } catch {
            Write-Host "[Warning] Connection test failed (may be ngrok free tier limit)" -ForegroundColor Yellow
            Write-Host "Please open in browser: $publicUrl/api/v1/health" -ForegroundColor Yellow
            Write-Host ""
        }
        
    } else {
        Write-Host "[Warning] Ngrok is running but no active tunnels" -ForegroundColor Yellow
        Write-Host ""
    }
    
} catch {
    Write-Host "[ERROR] Ngrok not running or cannot connect" -ForegroundColor Red
    Write-Host ""
    
    Write-Host "Startup Steps:" -ForegroundColor Yellow
    Write-Host "  1. Run: .\start_services.ps1" -ForegroundColor White
    Write-Host "  OR" -ForegroundColor Gray
    Write-Host "  1. Open new PowerShell terminal" -ForegroundColor White
    Write-Host "  2. Run: .\ngrok.exe http 8080" -ForegroundColor Cyan
    Write-Host "  3. Wait a few seconds" -ForegroundColor White
    Write-Host "  4. Run this script again" -ForegroundColor White
    Write-Host ""
    
    Write-Host "If ngrok.exe doesn't exist:" -ForegroundColor Yellow
    Write-Host "  Visit https://ngrok.com/download" -ForegroundColor White
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""