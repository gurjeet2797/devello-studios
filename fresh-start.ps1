# PowerShell script to create fresh orphan branch (no secrets in history)

Write-Host "Creating orphan branch..." -ForegroundColor Green
git checkout --orphan fresh-start

Write-Host "Removing all files from staging..." -ForegroundColor Green
git rm -rf --cached .

Write-Host "Adding all files (respecting .gitignore)..." -ForegroundColor Green
git add .

Write-Host "Creating initial commit..." -ForegroundColor Green
git commit -m "Initial commit: Devello Studios separated codebase

- Separated Studios from main domain
- Removed main domain pages and components
- Simplified middleware for studios-only routing
- Updated navigation to use NavigationStudios
- Kept all tool functionality (lighting, general-edit, assisted-edit)
- Preserved shared infrastructure (Supabase, auth, API routes)"

Write-Host "Deleting old master branch..." -ForegroundColor Yellow
git branch -D master

Write-Host "Renaming branch to master..." -ForegroundColor Green
git branch -M master

Write-Host "Ready to push! Run: git push -u origin master --force" -ForegroundColor Cyan
