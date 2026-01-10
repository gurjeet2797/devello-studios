# Real-time log monitoring script for Devello Inc
Write-Host "🔍 Starting real-time log monitoring for Devello Inc..." -ForegroundColor Green
Write-Host "📡 Server URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "⏹️  Press Ctrl+C to stop monitoring" -ForegroundColor Yellow
Write-Host ""

# Function to get the latest log entries
function Get-ServerLogs {
    $processes = Get-Process | Where-Object { $_.ProcessName -eq "node" }
    if ($processes) {
        Write-Host "✅ Node.js processes running: $($processes.Count)" -ForegroundColor Green
        foreach ($proc in $processes) {
            Write-Host "   PID: $($proc.Id), Memory: $([math]::Round($proc.WorkingSet64/1MB, 1))MB" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ No Node.js processes found" -ForegroundColor Red
    }
}

# Function to test API endpoints
function Test-APIEndpoints {
    Write-Host "🧪 Testing API endpoints..." -ForegroundColor Cyan
    
    # Test upload endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/upload" -Method POST -ContentType "multipart/form-data" -TimeoutSec 5
        Write-Host "✅ Upload endpoint: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Upload endpoint: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test placeholder endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/placeholder/100/100" -TimeoutSec 5
        Write-Host "✅ Placeholder endpoint: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Placeholder endpoint: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main monitoring loop
while ($true) {
    Clear-Host
    Write-Host "🕐 $(Get-Date -Format 'HH:mm:ss') - Devello Inc Log Monitor" -ForegroundColor Magenta
    Write-Host "=" * 60 -ForegroundColor Gray
    
    Get-ServerLogs
    Write-Host ""
    
    # Check if server is responding
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3
        Write-Host "✅ Server Status: Running (HTTP $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "❌ Server Status: Not responding" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "📊 Environment Variables:" -ForegroundColor Cyan
    Write-Host "   NODE_ENV: $env:NODE_ENV" -ForegroundColor Gray
    Write-Host "   DEBUG_MODE: $env:DEBUG_MODE" -ForegroundColor Gray
    Write-Host "   LOG_LEVEL: $env:LOG_LEVEL" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "🔄 Refreshing in 5 seconds... (Press Ctrl+C to exit)" -ForegroundColor Yellow
    
    Start-Sleep -Seconds 5
}
