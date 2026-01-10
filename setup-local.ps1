# Local Environment Setup Script
Write-Host "Local Environment Setup" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Cyan

Write-Host "`nThis script will help you configure your local environment variables." -ForegroundColor Yellow
Write-Host "You'll need your Supabase and Replicate credentials ready." -ForegroundColor White

Write-Host "`n🔧 Configuration Steps:" -ForegroundColor Cyan
Write-Host "1. Supabase Project Settings" -ForegroundColor White
Write-Host "2. Replicate API Token" -ForegroundColor White
Write-Host "3. Database Connection" -ForegroundColor White

Write-Host "`n📋 Required Information:" -ForegroundColor Cyan
Write-Host "- Supabase Project URL (from your Supabase dashboard)" -ForegroundColor Gray
Write-Host "- Supabase Anon Key (from your Supabase dashboard)" -ForegroundColor Gray
Write-Host "- Supabase Service Role Key (from your Supabase dashboard)" -ForegroundColor Gray
Write-Host "- Replicate API Token (from replicate.com/account/api-tokens)" -ForegroundColor Gray
Write-Host "- Database Password (from your Supabase database settings)" -ForegroundColor Gray

Write-Host "`n📝 Please manually update your .env file with the following values:" -ForegroundColor Yellow

Write-Host "`n1. SUPABASE_URL" -ForegroundColor Cyan
Write-Host "   Replace: https://[YOUR-PROJECT-ID].supabase.co" -ForegroundColor Gray
Write-Host "   With: https://your-actual-project-id.supabase.co" -ForegroundColor White

Write-Host "`n2. SUPABASE_ANON_KEY" -ForegroundColor Cyan
Write-Host "   Replace: [YOUR-ANON-KEY]" -ForegroundColor Gray
Write-Host "   With: your-actual-anon-key" -ForegroundColor White

Write-Host "`n3. SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Cyan
Write-Host "   Replace: [YOUR-SERVICE-ROLE-KEY]" -ForegroundColor Gray
Write-Host "   With: your-actual-service-role-key" -ForegroundColor White

Write-Host "`n4. REPLICATE_API_TOKEN" -ForegroundColor Cyan
Write-Host "   Replace: [YOUR-REPLICATE-API-TOKEN]" -ForegroundColor Gray
Write-Host "   With: r8_your-actual-token" -ForegroundColor White

Write-Host "`n5. DATABASE_URL" -ForegroundColor Cyan
Write-Host "   Replace: [YOUR-PASSWORD]" -ForegroundColor Gray
Write-Host "   With: your-actual-database-password" -ForegroundColor White

Write-Host "`n✅ After updating .env file:" -ForegroundColor Green
Write-Host "1. Run .\dev-mobile.ps1 to start the development server" -ForegroundColor White
Write-Host "2. Test file upload functionality" -ForegroundColor White
Write-Host "3. Test AI prediction endpoints" -ForegroundColor White
Write-Host "4. Test mobile access at http://192.168.1.156:3000" -ForegroundColor White

Write-Host "`n📚 Help:" -ForegroundColor Cyan
Write-Host "- Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor Gray
Write-Host "- Replicate API Tokens: https://replicate.com/account/api-tokens" -ForegroundColor Gray
Write-Host "- Local Testing Guide: See LOCAL_TESTING_GUIDE.md" -ForegroundColor Gray

Write-Host "`nPress any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
