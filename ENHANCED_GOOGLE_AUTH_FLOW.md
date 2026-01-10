# Enhanced Google OAuth Authentication Flow

## Overview

This document describes the enhanced Google OAuth authentication system that addresses the issues with Google Workspace users experiencing repeated 2FA prompts and provides better account selection options.

## Key Features

### 🔐 **Reduced 2FA Prompts**
- **Smart Session Management**: Tracks when 2FA was last completed
- **30-Day 2FA Reset**: Automatically resets 2FA requirement monthly for security
- **Session Persistence**: Maintains authentication state across browser sessions

### 👥 **Account Selection**
- **Always Show Account Picker**: Users can choose which Google account to use
- **Multiple Sign-in Options**: Standard, account selection, and re-authorization flows
- **Workspace Support**: Better handling of Google Workspace accounts

### 🔄 **Automatic Token Management**
- **Refresh Token Support**: Requests offline access for longer sessions
- **Automatic Renewal**: Handles token refresh transparently
- **Session Cleanup**: Proper cleanup on sign-out

## Implementation Details

### 1. Enhanced Session Manager (`lib/authSessionManager.js`)

```javascript
// Key features:
- shouldSkipTwoFactorAuth() // Checks if 2FA can be skipped
- recordTwoFactorCompletion() // Records successful 2FA
- Enhanced Google OAuth with account selection
- Better session storage and management
```

**OAuth Parameters:**
- `prompt: 'select_account'` - Always show account picker
- `access_type: 'offline'` - Request refresh token
- `include_granted_scopes: 'true'` - Include all granted scopes

### 2. Monthly 2FA Reset System (`lib/monthly2FAReset.js`)

```javascript
// Automatic monthly reset for security:
- 30-day reset cycle
- Automatic scheduling
- Manual reset capability
- Status tracking
```

### 3. Enhanced Google Auth Button (`components/auth/GoogleAuthButton.js`)

**Three Sign-in Options:**
1. **Standard Sign-in**: Quick authentication with existing session
2. **Account Selection**: Force account picker to appear
3. **Re-authorization**: Force consent screen for fresh permissions

### 4. Updated Auth Provider (`components/auth/AuthProvider.js`)

**New Methods:**
- `signInWithGoogleWithAccountSelection()` - Force account picker
- `signInWithGoogleWithConsent()` - Force consent screen
- Enhanced session management integration

## User Experience Flow

### First-Time Users
1. Click "Continue with Google"
2. Google account picker appears
3. Complete 2FA if required
4. Session stored for 30 days

### Returning Users (Within 30 Days)
1. Click "Continue with Google"
2. Account picker appears (can select different account)
3. **No 2FA required** (if completed within 30 days)
4. Seamless authentication

### Monthly Reset (Every 30 Days)
1. System automatically resets 2FA requirement
2. Next sign-in will require 2FA again
3. Cycle repeats for security

### Account Selection Options
1. **Standard**: Uses existing session if available
2. **Choose Account**: Always shows account picker
3. **Re-authorize**: Forces fresh consent and permissions

## Configuration

### Environment Variables
```bash
# Existing Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Google Cloud Console Settings
```javascript
// OAuth Consent Screen Configuration:
- App Type: Web application
- Authorized redirect URIs:
  - https://your-domain.com/auth/callback
  - https://your-project.supabase.co/auth/v1/callback
- Scopes: email, profile, openid
```

### Supabase Configuration
```javascript
// Authentication > Providers > Google:
- Enable Google provider
- Set Client ID and Secret
- Redirect URL: https://your-project.supabase.co/auth/v1/callback
```

## Security Features

### 🔒 **2FA Management**
- Tracks 2FA completion timestamps
- 30-day automatic reset for security
- Manual reset capability for admins

### 🔄 **Session Security**
- Automatic token refresh
- Secure session storage
- Proper cleanup on sign-out

### 🛡️ **Account Security**
- Always show account picker
- Support for multiple Google accounts
- Workspace account handling

## Troubleshooting

### Common Issues

1. **Still Getting 2FA Every Time**
   - Check if `monthly2FAReset.initialize()` is called
   - Verify localStorage is working
   - Check browser console for errors

2. **Account Picker Not Showing**
   - Ensure `prompt: 'select_account'` is set
   - Check Google Cloud Console redirect URIs
   - Verify Supabase configuration

3. **Session Not Persisting**
   - Check if refresh tokens are being requested
   - Verify `access_type: 'offline'` parameter
   - Check Supabase session configuration

### Debug Steps

1. **Check Session Status:**
   ```javascript
   // In browser console:
   console.log(authSessionManager.getStoredSessionInfo());
   console.log(monthly2FAReset.getResetStatus());
   ```

2. **Force Reset (Testing):**
   ```javascript
   // Force immediate 2FA reset:
   monthly2FAReset.forceReset();
   ```

3. **Check 2FA Status:**
   ```javascript
   // Check if 2FA can be skipped:
   console.log(authSessionManager.shouldSkipTwoFactorAuth());
   ```

## API Reference

### AuthSessionManager Methods

```javascript
// Sign in with options
await authSessionManager.signInWithGoogle({
  forceAccountSelection: true,  // Force account picker
  forceConsent: true           // Force consent screen
});

// Check 2FA status
const canSkip2FA = authSessionManager.shouldSkipTwoFactorAuth();

// Record 2FA completion
authSessionManager.recordTwoFactorCompletion();

// Get session info
const sessionInfo = authSessionManager.getStoredSessionInfo();
```

### Monthly2FAReset Methods

```javascript
// Initialize system
monthly2FAReset.initialize();

// Check reset status
const status = monthly2FAReset.getResetStatus();

// Force reset
monthly2FAReset.forceReset();

// Get days until reset
const days = monthly2FAReset.getDaysUntilReset();
```

## Migration Guide

### For Existing Users
1. **No Breaking Changes**: Existing authentication continues to work
2. **Enhanced Experience**: Users get better account selection
3. **Reduced 2FA**: Existing users benefit from reduced 2FA prompts

### For New Implementations
1. Import the enhanced components
2. Initialize the monthly reset system
3. Use the new GoogleAuthButton component
4. Configure Google Cloud Console settings

## Best Practices

### 🔧 **Development**
- Test with multiple Google accounts
- Verify 2FA reset cycle works
- Check session persistence across browser restarts

### 🚀 **Production**
- Monitor 2FA reset events
- Track authentication success rates
- Set up alerts for authentication failures

### 🔒 **Security**
- Regularly review Google OAuth settings
- Monitor for unusual authentication patterns
- Keep Supabase and Google configurations in sync

## Support

### Common Solutions

1. **2FA Still Required**: Check if monthly reset system is initialized
2. **Account Picker Not Working**: Verify Google Cloud Console settings
3. **Session Not Persisting**: Check refresh token configuration

### Debug Tools

- Browser console logging
- Supabase authentication logs
- Google Cloud Console OAuth logs

---

**Note**: This enhanced authentication system maintains backward compatibility while providing a significantly improved user experience for Google Workspace users and all users with multiple Google accounts.
