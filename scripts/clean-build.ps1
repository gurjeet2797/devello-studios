# Clean Next.js build cache (Windows PowerShell)
# This script safely removes the .next directory to fix EINVAL errors

Write-Host "Cleaning Next.js build cache..." -ForegroundColor Yellow

# Stop any running Node processes
Write-Host "Stopping Node processes..." -ForegroundColor Cyan
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Remove .next directory with retry logic
if (Test-Path .next) {
    Write-Host "Removing .next directory..." -ForegroundColor Cyan
    $maxRetries = 3
    $retryCount = 0
    $success = $false
    
    while ($retryCount -lt $maxRetries -and -not $success) {
        try {
            Remove-Item -Recurse -Force .next -ErrorAction Stop
            $success = $true
            Write-Host "[OK] .next directory removed successfully" -ForegroundColor Green
        } catch {
            $retryCount++
            Write-Host "Attempt $retryCount failed, retrying..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
            
            if ($retryCount -eq $maxRetries) {
                Write-Host "[ERROR] Failed to remove .next after $maxRetries attempts" -ForegroundColor Red
                Write-Host "Try manually deleting the .next folder or exclude it from OneDrive sync" -ForegroundColor Yellow
                exit 1
            }
        }
    }
} else {
    Write-Host "[OK] .next directory doesn't exist" -ForegroundColor Green
}

# Remove other cache directories
$cacheDirs = @("out", "node_modules\.cache")
foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Write-Host "Removing $dir..." -ForegroundColor Cyan
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "[OK] Build cache cleaned successfully!" -ForegroundColor Green
Write-Host "You can now run: npm run build" -ForegroundColor Cyan
