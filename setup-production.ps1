# Production Setup Script for Devello Inc
Write-Host "🚀 Setting up Devello Inc for Production" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan

# Function to update .env file
function Update-EnvFile {
    param(
        [string]$Key,
        [string]$Value,
        [string]$Description
    )
    
    Write-Host "`n📝 $Description" -ForegroundColor Yellow
    Write-Host "Current value: $Key" -ForegroundColor Gray
    
    $newValue = Read-Host "Enter new value (or press Enter to skip)"
    
    if ($newValue) {
        # Update .env file
        $envContent = Get-Content .env -Raw
        $pattern = "$Key=.*"
        $replacement = "$Key=`"$newValue`""
        
        if ($envContent -match $pattern) {
            $envContent = $envContent -replace $pattern, $replacement
        } else {
            $envContent += "`n$replacement"
        }
        
        Set-Content .env $envContent -NoNewline
        Write-Host "✅ Updated $Key" -ForegroundColor Green
    } else {
        Write-Host "⏭️ Skipped $Key" -ForegroundColor Yellow
    }
}

Write-Host "`n🔧 Configuration Steps:" -ForegroundColor Cyan
Write-Host "1. Supabase Project Settings" -ForegroundColor White
Write-Host "2. Replicate API Token" -ForegroundColor White
Write-Host "3. Database Connection" -ForegroundColor White
Write-Host "4. Production URL" -ForegroundColor White

Write-Host "`n📋 Required Information:" -ForegroundColor Cyan
Write-Host "- Supabase Project URL" -ForegroundColor Gray
Write-Host "- Supabase Anon Key" -ForegroundColor Gray
Write-Host "- Supabase Service Role Key" -ForegroundColor Gray
Write-Host "- Replicate API Token (r8_...)" -ForegroundColor Gray
Write-Host "- Database Password" -ForegroundColor Gray

# Update environment variables
Update-EnvFile "SUPABASE_URL" "https://your-project-id.supabase.co" "Supabase Project URL"
Update-EnvFile "SUPABASE_ANON_KEY" "your-anon-key" "Supabase Anon Key"
Update-EnvFile "SUPABASE_SERVICE_ROLE_KEY" "your-service-role-key" "Supabase Service Role Key"
Update-EnvFile "REPLICATE_API_TOKEN" "r8_your-token" "Replicate API Token"
Update-EnvFile "DATABASE_URL" "postgresql://postgres:password@host:5432/postgres" "Database Connection String"

Write-Host "`n✅ Configuration Complete!" -ForegroundColor Green
Write-Host "`n🔍 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Verify your Supabase project has the 'images' bucket created" -ForegroundColor White
Write-Host "2. Set up storage policies for public access" -ForegroundColor White
Write-Host "3. Run 'npm run dev' to test the application" -ForegroundColor White
Write-Host "4. Check console logs for any configuration errors" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "- Supabase Setup: See SUPABASE_SETUP.md" -ForegroundColor Gray
Write-Host "- API Documentation: See docs/API.md" -ForegroundColor Gray
