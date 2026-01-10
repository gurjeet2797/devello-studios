# Mobile Development Testing Script
Write-Host "Mobile Development Testing Setup" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Cyan

# Function to check if running on local network
function Test-LocalNetwork {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"} | Select-Object -First 1).IPAddress
    if ($localIP) {
        Write-Host "OK Local IP detected: $localIP" -ForegroundColor Green
        return $localIP
    } else {
        Write-Host "X No local network IP found" -ForegroundColor Red
        return $null
    }
}

# Function to start development server with mobile optimization
function Start-MobileDev {
    param(
        [string]$LocalIP
    )
    
    Write-Host "`nStarting mobile-optimized development server..." -ForegroundColor Yellow
    
    # Set environment variables for mobile testing
    $env:MOBILE_OPTIMIZATION = "true"
    $env:HEIC_SUPPORT = "true"
    $env:TOUCH_OPTIMIZATION = "true"
    $env:ENABLE_MOBILE_DEBUG = "true"
    
    # Start the development server
    if ($LocalIP) {
        Write-Host "Server will be available at:" -ForegroundColor Cyan
        Write-Host "  Local: http://localhost:3000" -ForegroundColor White
        Write-Host "  Mobile: http://$LocalIP:3000" -ForegroundColor White
        Write-Host "`nMobile Testing Instructions:" -ForegroundColor Cyan
        Write-Host "1. Connect your iPhone/iPad to the same WiFi network" -ForegroundColor White
        Write-Host "2. Open Safari and navigate to: http://$LocalIP:3000" -ForegroundColor White
        Write-Host "3. Test HEIC file uploads from your device" -ForegroundColor White
        Write-Host "4. Test touch interactions and mobile UI" -ForegroundColor White
    }
    
    # Start npm run dev
    npm run dev
}

# Function to show mobile testing tips
function Show-MobileTestingTips {
    Write-Host "`nMobile Testing Tips:" -ForegroundColor Cyan
    Write-Host "1. HEIC Files:" -ForegroundColor White
    Write-Host "   - Take photos with iPhone/iPad camera" -ForegroundColor Gray
    Write-Host "   - Test HEIC to JPEG conversion" -ForegroundColor Gray
    Write-Host "   - Verify image quality after processing" -ForegroundColor Gray
    
    Write-Host "`n2. Touch Interactions:" -ForegroundColor White
    Write-Host "   - Test file upload button responsiveness" -ForegroundColor Gray
    Write-Host "   - Verify drag-and-drop works on touch" -ForegroundColor Gray
    Write-Host "   - Check button sizes (minimum 44px)" -ForegroundColor Gray
    
    Write-Host "`n3. Performance:" -ForegroundColor White
    Write-Host "   - Monitor upload speeds on mobile network" -ForegroundColor Gray
    Write-Host "   - Test with large HEIC files (>10MB)" -ForegroundColor Gray
    Write-Host "   - Check memory usage during processing" -ForegroundColor Gray
    
    Write-Host "`n4. UI/UX:" -ForegroundColor White
    Write-Host "   - Verify responsive design on different screen sizes" -ForegroundColor Gray
    Write-Host "   - Test portrait and landscape orientations" -ForegroundColor Gray
    Write-Host "   - Check accessibility features" -ForegroundColor Gray
}

# Main execution
Write-Host "Checking local network configuration..." -ForegroundColor Yellow
$localIP = Test-LocalNetwork

if ($localIP) {
    Show-MobileTestingTips
    Start-MobileDev -LocalIP $localIP
} else {
    Write-Host "`nStarting development server without mobile network access..." -ForegroundColor Yellow
    Write-Host "You can still test locally at http://localhost:3000" -ForegroundColor White
    Start-MobileDev
}
