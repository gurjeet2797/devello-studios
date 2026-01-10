# Configuration Verification Script
Write-Host "Verifying Devello Inc Configuration" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan

# Load environment variables
$envContent = Get-Content .env -ErrorAction SilentlyContinue
if (!$envContent) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

# Parse environment variables
$envVars = @{}
foreach ($line in $envContent) {
    if ($line -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim('"')
        $envVars[$key] = $value
    }
}

Write-Host "`n📊 Environment Variables Status:" -ForegroundColor Cyan

# Check required variables
$requiredVars = @(
    @{Key="SUPABASE_URL"; Description="Supabase Project URL"},
    @{Key="SUPABASE_ANON_KEY"; Description="Supabase Anon Key"},
    @{Key="SUPABASE_SERVICE_ROLE_KEY"; Description="Supabase Service Role Key"},
    @{Key="REPLICATE_API_TOKEN"; Description="Replicate API Token"},
    @{Key="DATABASE_URL"; Description="Database Connection"}
)

$allValid = $true

foreach ($var in $requiredVars) {
    $key = $var.Key
    $desc = $var.Description
    $value = $envVars[$key]
    
        if ($value -and $value -notmatch '\[YOUR-.*\]' -and $value -notmatch 'your-.*') {
        Write-Host "OK $desc - Configured" -ForegroundColor Green
} else {
    Write-Host "X $desc - Not configured" -ForegroundColor Red
        $allValid = $false
    }
}

# Check specific patterns
Write-Host "`nValidation Checks:" -ForegroundColor Cyan

# Supabase URL format
if ($envVars["SUPABASE_URL"] -match 'https://.*\.supabase\.co') {
    Write-Host "OK Supabase URL format: Valid" -ForegroundColor Green
} else {
    Write-Host "X Supabase URL format: Invalid" -ForegroundColor Red
    $allValid = $false
}

# Replicate token format
if ($envVars["REPLICATE_API_TOKEN"] -match '^r8_') {
    Write-Host "OK Replicate token format: Valid" -ForegroundColor Green
} else {
    Write-Host "X Replicate token format: Invalid (should start with r8_)" -ForegroundColor Red
    $allValid = $false
}

# Database URL format
if ($envVars["DATABASE_URL"] -match 'postgresql://.*@.*:5432/.*') {
    Write-Host "OK Database URL format: Valid" -ForegroundColor Green
} else {
    Write-Host "X Database URL format: Invalid" -ForegroundColor Red
    $allValid = $false
}

Write-Host "`nConfiguration Summary:" -ForegroundColor Cyan
if ($allValid) {
    Write-Host "OK All configurations are valid!" -ForegroundColor Green
    Write-Host "Ready to start the application" -ForegroundColor Green
} else {
    Write-Host "X Some configurations are missing or invalid" -ForegroundColor Red
    Write-Host "Run .\setup-production.ps1 to configure missing values" -ForegroundColor Yellow
}

Write-Host "`nNext Steps:" -ForegroundColor Cyan
if ($allValid) {
    Write-Host "1. Run 'npm run dev' to start the development server" -ForegroundColor White
    Write-Host "2. Test file upload functionality" -ForegroundColor White
    Write-Host "3. Test AI prediction endpoints" -ForegroundColor White
    Write-Host "4. Monitor console logs for any errors" -ForegroundColor White
} else {
    Write-Host "1. Run .\setup-production.ps1 to configure missing values" -ForegroundColor White
    Write-Host "2. Verify your Supabase project settings" -ForegroundColor White
    Write-Host "3. Check your Replicate API token" -ForegroundColor White
    Write-Host "4. Ensure database connection is accessible" -ForegroundColor White
}
