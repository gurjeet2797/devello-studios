# Fixing EBUSY 4082 Error on Windows/OneDrive

The EBUSY 4082 error occurs when trying to delete or modify files that are locked by another process, commonly OneDrive sync on Windows.

## Quick Fixes

### 1. Stop the Dev Server
If you're running `npm run dev`, stop it first:
```bash
# Press Ctrl+C to stop the server
```

### 2. Clean Build Directory
```bash
npm run clean
```

Or manually:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/clean-build.ps1
```

### 3. Close File Handles
- Close any editors (VS Code, Cursor) that might have files open
- Close any file explorers showing the project directory
- Stop any antivirus scans on the project folder

### 4. Pause OneDrive Sync Temporarily
1. Right-click OneDrive icon in system tray
2. Click **Pause syncing** → **2 hours**
3. Try your operation again
4. Resume syncing after

## Permanent Solutions

### Option 1: Exclude Project from OneDrive (Recommended)

1. Right-click OneDrive icon → **Settings**
2. Go to **Sync and backup** → **Advanced settings**
3. Click **Choose folders**
4. Uncheck your project folder or exclude `.next` and `node_modules`

### Option 2: Move Project Outside OneDrive

Move your project to a location outside OneDrive:
- `C:\Projects\Devello-Studio-1`
- `D:\Development\Devello-Studio-1`

### Option 3: Use .onedriveignore

Create a `.onedriveignore` file in your project root:
```
.next/
out/
node_modules/
*.log
.DS_Store
```

## Why This Happens

- OneDrive tries to sync files while Next.js dev server is accessing them
- Windows file locking prevents deletion of files in use
- Antivirus scanners can lock files during scanning
- File watchers (like Next.js) keep files open for hot reload

## Prevention

1. **Exclude build directories** from OneDrive sync
2. **Use Git** for version control instead of OneDrive
3. **Move project** outside OneDrive for development
4. **Pause OneDrive** during active development sessions

## Code Fixes Applied

The upload API now includes retry logic for EBUSY errors:
- Retries file deletion after 100ms delay
- Handles both EBUSY and EINVAL errors gracefully
- Logs warnings instead of failing completely

