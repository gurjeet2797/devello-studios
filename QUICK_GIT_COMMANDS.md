# Quick Git Commands Template

## Basic Commands (Copy & Paste)

### 1. Check Status First
```powershell
git status
```

### 2. Stage All Changes
```powershell
git add -A
```

### 3. Commit with Message
```powershell
git commit -m "Your commit message here"
```

### 4. Push to Master
```powershell
git push origin master
```

---

## One-Liner (All in One)
```powershell
git add -A; git commit -m "Your commit message here"; git push origin master
```

---

## With Status Check (Recommended)
```powershell
# Step 1: Check what changed
git status

# Step 2: Stage all changes
git add -A

# Step 3: Commit
git commit -m "Fix: Description of changes"

# Step 4: Push
git push origin master
```

---

## Example Commit Messages

### Bug Fix
```powershell
git commit -m "Fix: Guest checkout email field styling issue"
```

### Feature
```powershell
git commit -m "Feature: Auto-open cart after sign-in from guest checkout"
```

### Security
```powershell
git commit -m "Security: Fix API response handling and add timeout protection"
```

### Multiple Changes
```powershell
git commit -m "Fix: Guest checkout styling and auto-open cart after sign-in

- Fixed email field white background issue in dark mode
- Added auto-open cart functionality after sign-in
- Improved user experience for guest checkout flow"
```

---

## Using the PowerShell Script

1. **Run with message:**
   ```powershell
   .\git-commit-push.ps1 "Your commit message here"
   ```

2. **Example:**
   ```powershell
   .\git-commit-push.ps1 "Fix: Guest checkout email field and auto-open cart"
   ```

---

## Quick Copy-Paste Template

Replace `YOUR_MESSAGE` with your actual commit message:

```powershell
git add -A
git commit -m "YOUR_MESSAGE"
git push origin master
```

---

## Safety Check (Before Pushing)

```powershell
# See what will be committed
git diff --cached

# See all changes
git diff

# Check remote status
git status
```

