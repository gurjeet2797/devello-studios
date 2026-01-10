# Vercel Deployment Verification Script
Write-Host "Vercel Deployment Verification" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Cyan

# Function to check if running on Vercel
function Test-VercelEnvironment {
    if ($env:VERCEL -eq "1") {
        Write-Host "OK Running on Vercel" -ForegroundColor Green
        return $true
    } else {
        Write-Host "X Not running on Vercel (local development)" -ForegroundColor Yellow
        return $false
    }
}

# Function to check environment variables
function Test-EnvironmentVariables {
    Write-Host "`nEnvironment Variables Check:" -ForegroundColor Cyan
    
    $requiredVars = @(
        @{Key="DATABASE_URL"; Description="Database Connection"},
        @{Key="SUPABASE_URL"; Description="Supabase Project URL"},
        @{Key="SUPABASE_ANON_KEY"; Description="Supabase Anon Key"},
        @{Key="SUPABASE_SERVICE_ROLE_KEY"; Description="Supabase Service Role Key"},
        @{Key="REPLICATE_API_TOKEN"; Description="Replicate API Token"},
        @{Key="NODE_ENV"; Description="Node Environment"},
        @{Key="VERCEL_URL"; Description="Vercel URL"}
    )
    
    $allValid = $true
    
    foreach ($var in $requiredVars) {
        $key = $var.Key
        $desc = $var.Description
        $value = [Environment]::GetEnvironmentVariable($key)
        
        if ($value -and $value -notmatch '\[YOUR-.*\]' -and $value -notmatch 'your-.*') {
            Write-Host "OK $desc - Set" -ForegroundColor Green
        } else {
            Write-Host "X $desc - Missing or placeholder" -ForegroundColor Red
            $allValid = $false
        }
    }
    
    return $allValid
}

# Function to check Vercel-specific variables
function Test-VercelVariables {
    Write-Host "`nVercel-Specific Variables:" -ForegroundColor Cyan
    
    $vercelVars = @(
        @{Key="VERCEL"; Description="Vercel Environment"},
        @{Key="VERCEL_URL"; Description="Vercel Deployment URL"},
        @{Key="VERCEL_ENV"; Description="Vercel Environment Type"}
    )
    
    foreach ($var in $vercelVars) {
        $key = $var.Key
        $desc = $var.Description
        $value = [Environment]::GetEnvironmentVariable($key)
        
        if ($value) {
            Write-Host "OK $desc - $value" -ForegroundColor Green
        } else {
            Write-Host "X $desc - Not set" -ForegroundColor Yellow
        }
    }
}

# Function to provide deployment instructions
function Show-DeploymentInstructions {
    Write-Host "`nVercel Deployment Instructions:" -ForegroundColor Cyan
    Write-Host "1. Go to Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Select your project" -ForegroundColor White
    Write-Host "3. Go to Settings > Environment Variables" -ForegroundColor White
    Write-Host "4. Add the following variables:" -ForegroundColor White
    Write-Host "   - DATABASE_URL" -ForegroundColor Gray
    Write-Host "   - SUPABASE_URL" -ForegroundColor Gray
    Write-Host "   - SUPABASE_ANON_KEY" -ForegroundColor Gray
    Write-Host "   - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Gray
    Write-Host "   - REPLICATE_API_TOKEN" -ForegroundColor Gray
    Write-Host "   - NODE_ENV=production" -ForegroundColor Gray
    Write-Host "   - DEBUG_MODE=false" -ForegroundColor Gray
    Write-Host "   - LOG_LEVEL=error" -ForegroundColor Gray
    Write-Host "5. Redeploy your project" -ForegroundColor White
}

# Main verification
$isVercel = Test-VercelEnvironment
$envValid = Test-EnvironmentVariables
Test-VercelVariables

Write-Host "`nVerification Summary:" -ForegroundColor Cyan
if ($isVercel -and $envValid) {
    Write-Host "OK Ready for Vercel deployment!" -ForegroundColor Green
} elseif ($isVercel -and -not $envValid) {
    Write-Host "X Environment variables need to be configured" -ForegroundColor Red
    Show-DeploymentInstructions
} else {
    Write-Host "X Local development environment detected" -ForegroundColor Yellow
    Write-Host "For production deployment, push to GitHub and configure Vercel" -ForegroundColor White
}

Write-Host "`nNext Steps:" -ForegroundColor Cyan
if ($isVercel) {
    Write-Host "1. Test your application functionality" -ForegroundColor White
    Write-Host "2. Monitor Vercel function logs" -ForegroundColor White
    Write-Host "3. Check Supabase storage is working" -ForegroundColor White
    Write-Host "4. Verify AI predictions are processing" -ForegroundColor White
} else {
    Write-Host "1. Push code to GitHub" -ForegroundColor White
    Write-Host "2. Connect repository to Vercel" -ForegroundColor White
    Write-Host "3. Configure environment variables" -ForegroundColor White
    Write-Host "4. Deploy and test" -ForegroundColor White
}
