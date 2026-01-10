# Git Commit and Push Script
# Usage: .\git-commit-push.ps1 "Your commit message here"

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

# Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Cyan
git status

# Stage all changes
Write-Host "`n📦 Staging all changes..." -ForegroundColor Yellow
git add -A

# Show what will be committed
Write-Host "`n📝 Changes to be committed:" -ForegroundColor Green
git status --short

# Commit with message
Write-Host "`n💾 Committing changes..." -ForegroundColor Yellow
git commit -m $CommitMessage

# Push to master
Write-Host "`n🚀 Pushing to master branch..." -ForegroundColor Yellow
git push origin master

Write-Host "`n✅ Done! Changes pushed to master." -ForegroundColor Green

