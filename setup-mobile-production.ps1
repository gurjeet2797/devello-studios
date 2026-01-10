# Mobile Production Setup Script
# This script sets up the required environment variables for mobile uploads in production

Write-Host "🚀 Setting up Mobile Production Environment..." -ForegroundColor Green

# Set mobile optimization environment variables
$env:MOBILE_OPTIMIZATION = "true"
$env:HEIC_SUPPORT = "true"
$env:TOUCH_OPTIMIZATION = "true"
$env:ENABLE_MOBILE_DEBUG = "true"

# Set debug mode for troubleshooting
$env:DEBUG_MODE = "true"
$env:LOG_LEVEL = "debug"

Write-Host "✅ Mobile environment variables set:" -ForegroundColor Green
Write-Host "  - MOBILE_OPTIMIZATION: $env:MOBILE_OPTIMIZATION"
Write-Host "  - HEIC_SUPPORT: $env:HEIC_SUPPORT"
Write-Host "  - TOUCH_OPTIMIZATION: $env:TOUCH_OPTIMIZATION"
Write-Host "  - ENABLE_MOBILE_DEBUG: $env:ENABLE_MOBILE_DEBUG"
Write-Host "  - DEBUG_MODE: $env:DEBUG_MODE"
Write-Host "  - LOG_LEVEL: $env:LOG_LEVEL"

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Add these environment variables to your Vercel dashboard:"
Write-Host "   - Go to Project Settings > Environment Variables"
Write-Host "   - Add each variable for Production environment"
Write-Host ""
Write-Host "2. Redeploy your application:"
Write-Host "   - Push changes to trigger new deployment"
Write-Host "   - Or manually redeploy from Vercel dashboard"
Write-Host ""
Write-Host "3. Test mobile uploads on deployed version"
Write-Host ""

Write-Host "🎯 Mobile uploads should now work in production!" -ForegroundColor Green
