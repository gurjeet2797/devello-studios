# Remove Secrets from Git History

GitHub blocked the push because secrets are in your git history. Here's how to fix it:

## Option 1: Fresh Start (Recommended for New Repo)

Since this is a new repository, create a fresh commit without secrets:

```bash
# 1. Remove the last commit (but keep files)
git reset --soft HEAD~1

# 2. Unstage all files
git reset

# 3. Remove any .env files from staging
git rm --cached .env .env.local .env.vercel .env.* 2>/dev/null || true

# 4. Make sure .gitignore is correct (already done)
# 5. Add all files except .env files
git add .

# 6. Create new commit
git commit -m "Initial commit: Devello Studios separated codebase

- Separated Studios from main domain
- Removed main domain pages and components
- Simplified middleware for studios-only routing
- Updated navigation to use NavigationStudios
- Kept all tool functionality (lighting, general-edit, assisted-edit)
- Preserved shared infrastructure (Supabase, auth, API routes)"

# 7. Push
git push -u origin master
```

## Option 2: Remove Secrets from Entire History (If Option 1 doesn't work)

If secrets are in multiple commits, use git filter-branch:

```bash
# Remove .env files from entire history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env .env.local .env.vercel .env.*" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history)
git push -u origin master --force
```

## Option 3: Use BFG Repo-Cleaner (Most Effective)

1. Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Run:
```bash
java -jar bfg.jar --delete-files .env
java -jar bfg.jar --delete-files .env.local
java -jar bfg.jar --delete-files .env.vercel
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push -u origin master --force
```

## Quick Fix (Try This First)

```bash
# Remove commit, keep files
git reset --soft HEAD~1

# Remove .env files from git tracking
git rm --cached .env* 2>/dev/null || true

# Re-add everything (respecting .gitignore)
git add .

# Commit again
git commit -m "Initial commit: Devello Studios separated codebase"

# Push
git push -u origin master
```
