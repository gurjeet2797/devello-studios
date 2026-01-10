# Test Servers Script - Run both local and mobile servers
Write-Host "Starting Test Servers" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Cyan

# Function to get local IP
function Get-LocalIP {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"} | Select-Object -First 1).IPAddress
    return $localIP
}

# Function to start local server (port 3000)
function Start-LocalServer {
    Write-Host "`nStarting Local Server (Port 3000)..." -ForegroundColor Yellow
    Write-Host "Local: http://localhost:3000" -ForegroundColor White
    
    # Set environment for local testing
    $env:NODE_ENV = "development"
    $env:PORT = "3000"
    
    # Start in background
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
}

# Function to start mobile server (port 3001)
function Start-MobileServer {
    Write-Host "`nStarting Mobile Server (Port 3001)..." -ForegroundColor Yellow
    
    $localIP = Get-LocalIP
    if ($localIP) {
        Write-Host "Mobile: http://$localIP:3001" -ForegroundColor White
        Write-Host "Local: http://localhost:3001" -ForegroundColor White
    } else {
        Write-Host "Local: http://localhost:3001" -ForegroundColor White
    }
    
    # Set environment for mobile testing
    $env:NODE_ENV = "development"
    $env:PORT = "3001"
    $env:MOBILE_OPTIMIZATION = "true"
    $env:HEIC_SUPPORT = "true"
    $env:TOUCH_OPTIMIZATION = "true"
    $env:ENABLE_MOBILE_DEBUG = "true"
    
    # Start in background
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; $env:PORT='3001'; $env:MOBILE_OPTIMIZATION='true'; npm run dev"
}

# Function to show testing instructions
function Show-TestingInstructions {
    $localIP = Get-LocalIP
    
    Write-Host "`nTesting Instructions:" -ForegroundColor Cyan
    Write-Host "====================" -ForegroundColor Cyan
    
    Write-Host "`nLocal Server (Port 3000):" -ForegroundColor Yellow
    Write-Host "  - Desktop testing: http://localhost:3000" -ForegroundColor White
    Write-Host "  - Standard development environment" -ForegroundColor Gray
    
    Write-Host "`nMobile Server (Port 3001):" -ForegroundColor Yellow
    Write-Host "  - Desktop testing: http://localhost:3001" -ForegroundColor White
    if ($localIP) {
        Write-Host "  - Mobile testing: http://$localIP:3001" -ForegroundColor White
        Write-Host "  - Connect your phone to the same WiFi network" -ForegroundColor Gray
    }
    Write-Host "  - Mobile-optimized with HEIC support" -ForegroundColor Gray
    Write-Host "  - Touch-optimized UI elements" -ForegroundColor Gray
    
    Write-Host "`nMobile Testing Tips:" -ForegroundColor Cyan
    Write-Host "  - Test HEIC file uploads from iPhone/iPad" -ForegroundColor Gray
    Write-Host "  - Test touch interactions and responsive design" -ForegroundColor Gray
    Write-Host "  - Test on different screen sizes and orientations" -ForegroundColor Gray
    Write-Host "  - Monitor performance on mobile networks" -ForegroundColor Gray
}

# Main execution
Write-Host "Checking environment..." -ForegroundColor Yellow

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✓ NPM version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ NPM not found. Please install Node.js and NPM." -ForegroundColor Red
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start both servers
Start-LocalServer
Start-Sleep -Seconds 3
Start-MobileServer

# Show instructions
Start-Sleep -Seconds 2
Show-TestingInstructions

Write-Host "`nBoth servers are starting..." -ForegroundColor Green
Write-Host "Check the new PowerShell windows for server output." -ForegroundColor White
Write-Host "Press Ctrl+C in this window to stop all servers." -ForegroundColor Yellow

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 10
        Write-Host "Servers are running... (Press Ctrl+C to stop)" -ForegroundColor Gray
    }
} catch {
    Write-Host "`nStopping servers..." -ForegroundColor Yellow
    Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.MainWindowTitle -like "*npm*"} | Stop-Process -Force
    Write-Host "Servers stopped." -ForegroundColor Green
}
