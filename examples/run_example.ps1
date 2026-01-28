# run_example.ps1
# PowerShell version of run_example script

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Embedded AI Agent - Running Example  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/"
    exit 1
}

# Check dependencies
if (-not (Test-Path "../node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    Set-Location ..
    npm install
    Set-Location examples
}

# Check API Key
if (-not $env:QWEN_API_KEY) {
    Write-Host "Warning: QWEN_API_KEY environment variable is not set" -ForegroundColor Yellow
    Write-Host "Please set it before running:"
    Write-Host '  $env:QWEN_API_KEY="your_api_key_here"' -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Run example
Write-Host ""
Write-Host "Running example..." -ForegroundColor Green
Write-Host ""
Set-Location ..
node src/examples.js

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
