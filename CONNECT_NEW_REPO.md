# Connect to New Repository: devello-studios

## Current Status
- **Current Remote**: `https://github.com/gurjeet2797/Devello-Inc.git`
- **Current Branch**: `master`
- **New Repository**: `https://github.com/gurjeet2797/devello-studios.git`

## Commands to Disconnect and Connect

Run these commands in order:

### Step 1: Check Current Status
```bash
git remote -v
git branch
git status
```

### Step 2: Remove Old Remote (Devello-Inc)
```bash
git remote remove origin
```

### Step 3: Verify Old Remote is Removed
```bash
git remote -v
```
(Should show nothing or "fatal: No remote configured")

### Step 4: Add New Remote (devello-studios)
```bash
git remote add origin https://github.com/gurjeet2797/devello-studios.git
```

### Step 5: Verify New Remote is Added
```bash
git remote -v
```
Should show:
```
origin  https://github.com/gurjeet2797/devello-studios.git (fetch)
origin  https://github.com/gurjeet2797/devello-studios.git (push)
```

### Step 6: Rename Branch to main (if needed)
```bash
git branch -M main
```

### Step 7: Stage All Changes
```bash
git add .
```

### Step 8: Create Initial Commit (if you have uncommitted changes)
```bash
git commit -m "Initial commit: Devello Studios separated codebase

- Separated Studios from main domain
- Removed main domain pages and components
- Simplified middleware for studios-only routing
- Updated navigation to use NavigationStudios
- Kept all tool functionality (lighting, general-edit, assisted-edit)
- Preserved shared infrastructure (Supabase, auth, API routes)"
```

### Step 9: Push to New Repository (WHEN READY)
```bash
git push -u origin main
```

If the repository is empty and you get an error about unrelated histories, use:
```bash
git push -u origin main --force
```

## Complete Command Sequence (Copy & Paste)

```bash
# Check status
git remote -v
git status

# Remove old remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/gurjeet2797/devello-studios.git

# Verify
git remote -v

# Rename branch to main
git branch -M main

# Stage and commit
git add .
git commit -m "Initial commit: Devello Studios separated codebase"

# Push (when ready)
git push -u origin main
```

## Important Notes

- ✅ `.env.local` is in `.gitignore` - your secrets won't be pushed
- ✅ All connection to Devello-Inc repository will be removed
- ✅ New repository is empty and ready for your code
- ⚠️ Don't run the push command until you're ready to deploy
