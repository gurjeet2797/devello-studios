# Fixing EINVAL -4071 Error on Windows/OneDrive

The EINVAL -4071 error occurs when Next.js tries to create symlinks in the `.next` directory, but OneDrive interferes with this process.

## Quick Fix

Run the cleanup script:
```bash
npm run clean
```

Or manually:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/clean-build.ps1
```

## Permanent Solution: Exclude .next from OneDrive

### Option 1: OneDrive Settings (Recommended)

1. Right-click the OneDrive icon in the system tray
2. Click **Settings**
3. Go to **Sync and backup** → **Advanced settings**
4. Click **Choose folders**
5. Find your project folder and uncheck the `.next` folder (if visible)
6. Or exclude the entire project folder from OneDrive and use Git for version control instead

### Option 2: Move Project Outside OneDrive

Move your project to a location outside OneDrive (e.g., `C:\Projects\Devello-Studio-1`)

### Option 3: Use .onedriveignore (if available)

Create a `.onedriveignore` file in your project root:
```
.next/
out/
node_modules/
```

## Why This Happens

- Next.js creates symlinks in `.next` for optimization
- OneDrive tries to sync these symlinks
- Windows/OneDrive doesn't handle symlinks well, causing EINVAL errors
- The `.next` directory is already in `.gitignore` and shouldn't be synced

## Prevention

The `.next` directory is already excluded from Git. Make sure it's also excluded from OneDrive sync to prevent this issue.

