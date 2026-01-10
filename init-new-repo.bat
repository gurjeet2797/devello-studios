@echo off
echo Setting up new Devello-Studios repository...
echo.

REM Initialize git if not already done
if not exist .git (
    echo Initializing git repository...
    git init
    git branch -M main
)

REM Stage all files
echo Staging all files...
git add .

REM Check if there are changes
git diff --cached --quiet
if %errorlevel% neq 0 (
    echo Creating initial commit...
    git commit -m "Initial commit: Devello Studios separated codebase - Separated Studios from main domain - Removed main domain pages and components - Simplified middleware for studios-only routing - Updated navigation to use NavigationStudios - Kept all tool functionality (lighting, general-edit, assisted-edit) - Preserved shared infrastructure (Supabase, auth, API routes)"
    echo.
    echo Commit created successfully!
) else (
    echo No changes to commit.
)

echo.
echo ========================================
echo Next steps:
echo 1. Create repository on GitHub: Devello-studioscode
echo 2. Run: git remote add origin https://github.com/YOUR_USERNAME/Devello-studioscode.git
echo 3. Run: git push -u origin main
echo ========================================
pause
