# Setup script for new Devello-Studios repository
# Run this script to initialize and push to new GitHub repo

Write-Host "Setting up new Devello-Studios repository..." -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# Check current remotes
Write-Host "`nCurrent remotes:" -ForegroundColor Cyan
git remote -v

# Stage all changes
Write-Host "`nStaging all changes..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "`nCommitting changes..." -ForegroundColor Yellow
    git commit -m "Initial commit: Devello Studios separated codebase
    
    - Separated Studios from main domain
    - Removed main domain pages and components
    - Simplified middleware for studios-only routing
    - Updated navigation to use NavigationStudios
    - Kept all tool functionality (lighting, general-edit, assisted-edit)
    - Preserved shared infrastructure (Supabase, auth, API routes)"
} else {
    Write-Host "`nNo changes to commit." -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Create a new repository on GitHub called 'Devello-studioscode'" -ForegroundColor White
Write-Host "2. Run these commands:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/Devello-studioscode.git" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
