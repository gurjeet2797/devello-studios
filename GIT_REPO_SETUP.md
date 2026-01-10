# Git Repository Setup - Devello Studios

## Current Status Check

First, check your current git configuration:

```bash
# Check current remotes
git remote -v

# Check current branch
git branch

# Check git status
git status
```

## Step 1: Remove All Existing Remotes

If you have any existing remotes connected to the old devello-inc codebase, remove them:

```bash
# List all remotes
git remote -v

# Remove all existing remotes (replace 'origin' with actual remote name if different)
git remote remove origin

# If you have multiple remotes, remove each one:
# git remote remove upstream
# git remote remove old-origin
# etc.
```

## Step 2: Add New Repository

Connect to the new Devello Studios repository:

```bash
# Add the new remote
git remote add origin https://github.com/gurjeet2797/devello-studios.git

# Verify it was added correctly
git remote -v
```

You should see:
```
origin  https://github.com/gurjeet2797/devello-studios.git (fetch)
origin  https://github.com/gurjeet2797/devello-studios.git (push)
```

## Step 3: Stage and Commit Changes (if needed)

Before pushing, make sure all changes are committed:

```bash
# Check what files have changed
git status

# Stage all files
git add .

# Create commit (if you have uncommitted changes)
git commit -m "Initial commit: Devello Studios separated codebase

- Separated Studios from main domain
- Removed main domain pages and components
- Simplified middleware for studios-only routing
- Updated navigation to use NavigationStudios
- Kept all tool functionality (lighting, general-edit, assisted-edit)
- Preserved shared infrastructure (Supabase, auth, API routes)"
```

## Step 4: Push to New Repository

**IMPORTANT: Only run this when you're ready to push!**

```bash
# Push to the new repository
git push -u origin main
```

If the repository is empty and you get an error, you might need to force push (be careful!):
```bash
git push -u origin main --force
```

## Verification

After pushing, verify everything is connected:

```bash
# Check remote
git remote -v

# Check branch tracking
git branch -vv

# View commit history
git log --oneline -5
```

## Complete Command Sequence

Here's the complete sequence (run these one by one):

```bash
# 1. Check current status
git remote -v
git status

# 2. Remove old remotes (if any exist)
git remote remove origin

# 3. Add new remote
git remote add origin https://github.com/gurjeet2797/devello-studios.git

# 4. Verify new remote
git remote -v

# 5. Stage all files
git add .

# 6. Commit (if needed)
git commit -m "Initial commit: Devello Studios separated codebase"

# 7. Push to new repo (ONLY WHEN READY)
git push -u origin main
```

## Notes

- The repository at https://github.com/gurjeet2797/devello-studios.git appears to be empty
- Your `.env.local` file is already in `.gitignore` - it won't be pushed
- All sensitive files are excluded from git
- After pushing, you can connect this repo to Vercel for deployment
