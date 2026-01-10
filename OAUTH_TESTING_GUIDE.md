# OAuth Testing Guide for Multi-Domain Setup

## Quick Test Checklist

### 1. Test on Each Domain

#### Main Domain (develloinc.com)
1. Go to `https://develloinc.com`
2. Click "Sign In" or "Continue with Google" button
3. Should redirect to Google OAuth consent screen
4. After authorizing, should redirect back to `https://develloinc.com/auth/callback`
5. Should then redirect to homepage (or stored redirect path)
6. Check that you're logged in (profile icon shows, user menu works)

#### Studios Domain (devellostudios.com)
1. Go to `https://devellostudios.com`
2. Click "Sign In" or "Continue with Google" button
3. Should redirect to Google OAuth consent screen
4. After authorizing, should redirect back to `https://devellostudios.com/auth/callback`
5. Should then redirect to studios homepage
6. Check that you're logged in

#### Tech Domain (devellotech.com)
1. Go to `https://devellotech.com`
2. Click "Sign In" or "Continue with Google" button
3. Should redirect to Google OAuth consent screen
4. After authorizing, should redirect back to `https://devellotech.com/auth/callback`
5. Should then redirect to software homepage
6. Check that you're logged in

---

## Detailed Testing Steps

### Step 1: Open Browser DevTools
- Press `F12` or `Right-click → Inspect`
- Go to **Console** tab
- Go to **Network** tab (optional, for debugging)

### Step 2: Test Sign-In Flow

1. **Navigate to domain** (e.g., `https://devellostudios.com`)
2. **Click "Sign In" or "Continue with Google"**
3. **Watch the console** for any errors
4. **Expected flow:**
   - Redirects to `accounts.google.com` (OAuth consent screen)
   - You select/authorize Google account
   - Redirects to `https://[domain]/auth/callback?code=...`
   - Console shows: "Exchanging code for session..."
   - Redirects to homepage or stored redirect path
   - User is logged in

### Step 3: Verify Session Persistence

1. After successful login, **refresh the page**
2. User should **remain logged in**
3. Check that profile/user menu shows your account info

### Step 4: Test Cross-Domain Session

1. Log in on `develloinc.com`
2. Open `devellostudios.com` in a new tab
3. **Expected:** Should be logged in (same Supabase session)
4. Same for `devellotech.com`

---

## What to Look For

### ✅ Success Indicators

- **No console errors** during OAuth flow
- **Smooth redirect** from Google back to your domain
- **Callback page shows** "Authentication successful!" briefly
- **User is logged in** after callback
- **Session persists** across page refreshes
- **Cross-domain session** works (logged in on all domains)

### ❌ Error Indicators

- **Console errors** about redirect_uri_mismatch
- **Stuck on callback page** (spinning loader forever)
- **Redirected to homepage with error** (`?auth_error=...`)
- **Session not persisting** after login
- **Different session** on different domains

---

## Common Errors & Fixes

### Error: `redirect_uri_mismatch`

**Symptoms:**
- Google shows error: "Error 400: redirect_uri_mismatch"
- Console shows redirect URI doesn't match

**Fix:**
1. Check **Google Cloud Console** → **Credentials** → **OAuth 2.0 Client ID**
2. Ensure all three domains are in **Authorized redirect URIs**:
   - `https://develloinc.com/auth/callback`
   - `https://devellostudios.com/auth/callback`
   - `https://devellotech.com/auth/callback`
   - `https://vajxcznjxrfdrheqetca.supabase.co/auth/v1/callback`
3. **Save** and wait 1-2 minutes for changes to propagate

### Error: `code_exchange_failed` or `code_expired`

**Symptoms:**
- Callback page shows error
- URL has `?auth_error=code_exchange_failed`

**Fix:**
1. Check **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Ensure all three domains are in **Redirect URLs**
3. Ensure **Site URL** is set to `https://develloinc.com`
4. Try signing in again (codes expire quickly)

### Error: Stuck on Callback Page

**Symptoms:**
- Callback page shows "Processing..." forever
- No redirect happens

**Debug:**
1. Open **Console** tab in DevTools
2. Look for errors (red text)
3. Check **Network** tab for failed requests
4. Common causes:
   - Supabase environment variables not set in Vercel
   - CORS issues
   - Invalid Supabase URL/key

**Fix:**
1. Verify environment variables in **Vercel** project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Redeploy the project after adding variables
3. Clear browser cache and try again

### Error: Session Not Persisting

**Symptoms:**
- Login works, but after refresh, user is logged out
- Different session on different domains

**Debug:**
1. Check **Application** tab → **Local Storage**
2. Look for Supabase session keys
3. Check if cookies are being blocked

**Fix:**
1. Ensure cookies/localStorage are enabled
2. Check browser privacy settings
3. Try incognito/private mode to rule out extensions

---

## Debugging Commands

### Check Current Session (Browser Console)

```javascript
// Run in browser console on any domain
const supabase = window.__SUPABASE_CLIENT__ || 
  (await import('/lib/supabaseClient')).getSupabase();

const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);
console.log('User:', session?.user);
```

### Check Environment Variables

```javascript
// Run in browser console
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
```

### Test API Endpoint

Visit: `https://develloinc.com/api/check-supabase-config`

This will show you:
- Supabase configuration status
- OAuth configuration recommendations
- Any missing environment variables

---

## Testing Checklist

### Pre-Testing
- [ ] All URLs added to Supabase (Authentication → URL Configuration)
- [ ] All URLs added to Google Cloud Console (Credentials → OAuth 2.0 Client ID)
- [ ] Environment variables set in all three Vercel projects
- [ ] All three projects deployed successfully

### Domain Testing
- [ ] `develloinc.com` - Sign in works
- [ ] `devellostudios.com` - Sign in works
- [ ] `devellotech.com` - Sign in works
- [ ] All domains redirect correctly after OAuth
- [ ] Session persists on all domains
- [ ] Cross-domain session works (login on one, check others)

### Error Testing
- [ ] Test with invalid/expired code (should show error gracefully)
- [ ] Test with blocked cookies (should show error)
- [ ] Test network failure (should show error)

### Edge Cases
- [ ] Sign in, then sign out, then sign in again
- [ ] Sign in on one domain, sign out on another
- [ ] Multiple browser tabs (same domain)
- [ ] Incognito/private mode

---

## Quick Test Script

1. **Open three browser tabs:**
   - Tab 1: `https://develloinc.com`
   - Tab 2: `https://devellostudios.com`
   - Tab 3: `https://devellotech.com`

2. **On Tab 1:** Click "Sign In" → Complete Google OAuth

3. **Check all tabs:** Should show you're logged in on all three

4. **On Tab 2:** Refresh → Should still be logged in

5. **On Tab 3:** Sign out → Check Tab 1 and Tab 2 (should also be signed out)

---

## Still Having Issues?

1. **Check Vercel deployment logs** for build errors
2. **Check Supabase logs** (Dashboard → Logs → Auth)
3. **Check browser console** for detailed error messages
4. **Verify DNS propagation** (domains resolving correctly)
5. **Test in incognito mode** to rule out browser extensions
6. **Clear browser cache** and try again
