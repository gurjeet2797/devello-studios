# Fresh Start with Orphan Branch

This creates a completely new branch with no history - perfect for removing all secrets.

## Commands to Run

```bash
# 1. Create orphan branch (no history)
git checkout --orphan fresh-start

# 2. Remove all files from staging (they're still on disk)
git rm -rf --cached .

# 3. Add all files (respecting .gitignore - .env files won't be added)
git add .

# 4. Create initial commit
git commit -m "Initial commit: Devello Studios separated codebase

- Separated Studios from main domain
- Removed main domain pages and components
- Simplified middleware for studios-only routing
- Updated navigation to use NavigationStudios
- Kept all tool functionality (lighting, general-edit, assisted-edit)
- Preserved shared infrastructure (Supabase, auth, API routes)"

# 5. Delete old master branch
git branch -D master

# 6. Rename current branch to master
git branch -M master

# 7. Push to new repo (force push since it's a new history)
git push -u origin master --force
```

## What This Does

- ✅ Creates a branch with **zero history** (no secrets)
- ✅ Keeps all your current files
- ✅ Respects `.gitignore` (`.env` files stay local)
- ✅ Creates one clean commit
- ✅ Replaces the old branch with the new one

## After Pushing

Your repo will have a clean history with just one commit, and all secrets will be removed from git history.
