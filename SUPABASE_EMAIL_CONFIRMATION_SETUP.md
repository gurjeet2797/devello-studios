# Supabase Email Confirmation Setup Guide

## Issue
Users are not receiving email confirmation links when signing up with Devello.

## Solution

### Step 1: Enable Email Confirmation in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click on **Authentication** in the left sidebar
   - Click on **Settings** (or **URL Configuration**)

2. **Enable Email Confirmation**
   - Find **"Enable email confirmations"** toggle
   - Make sure it's **enabled** (turned ON)
   - If disabled, enable it and save

3. **Configure Site URL**
   - Set **Site URL** to your production URL:
     - Production: `https://develloinc.com`
     - Development: `http://localhost:3000` (for local testing)

4. **Add Redirect URLs**
   - In **Redirect URLs** section, add:
     - `https://develloinc.com/auth/callback`
     - `http://localhost:3000/auth/callback` (for development)
   - These URLs must match exactly where users will be redirected after clicking the confirmation link

### Step 2: Configure Email Templates (Optional but Recommended)

1. **Go to Authentication > Email Templates**
   - Click on **"Confirm signup"** template
   - Customize the email subject and body if desired
   - The confirmation link will be automatically included as `{{ .ConfirmationURL }}`

2. **Email Template Variables Available:**
   - `{{ .ConfirmationURL }}` - The confirmation link
   - `{{ .SiteURL }}` - Your site URL
   - `{{ .Email }}` - User's email address

### Step 3: Verify Email Service Configuration

Supabase uses its own email service by default, but you can configure custom SMTP:

1. **Go to Authentication > Settings**
   - Scroll to **"SMTP Settings"** section
   - If you want to use custom SMTP (Gmail, SendGrid, etc.):
     - Enable **"Enable Custom SMTP"**
     - Enter your SMTP credentials:
       - **SMTP Host**: e.g., `smtp.gmail.com`
       - **SMTP Port**: e.g., `587`
       - **SMTP User**: Your email address
       - **SMTP Password**: Your app password
       - **Sender Email**: Email address to send from
       - **Sender Name**: Display name (e.g., "Devello Inc")

2. **If using Supabase default email service:**
   - No configuration needed
   - Emails will be sent from `noreply@mail.app.supabase.io`
   - Check spam folder if emails don't arrive

### Step 4: Test Email Confirmation

1. **Test Sign Up**
   - Go to your app
   - Try signing up with a test email
   - Check the email inbox (and spam folder)

2. **Check Supabase Logs**
   - Go to **Logs** > **Auth Logs** in Supabase Dashboard
   - Look for email sending events
   - Check for any errors

### Step 5: Verify Code Implementation

The code has been updated to include the `emailRedirectTo` option:

**File:** `components/auth/AuthProvider.js`

```javascript
const signUp = async ({ email, password, metadata = {}, redirectPath = null }) => {
  // ... code includes emailRedirectTo option
  const emailRedirectTo = redirectPath 
    ? `${baseUrl}${redirectPath}`
    : `${baseUrl}/auth/callback`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: emailRedirectTo  // This tells Supabase where to redirect
    }
  });
}
```

## Troubleshooting

### Emails Not Sending

1. **Check Supabase Email Limits**
   - Free tier: 3 emails/hour
   - Pro tier: Higher limits
   - Check your usage in Dashboard > Settings > Usage

2. **Check Email Service Status**
   - Go to Supabase Dashboard > Status
   - Check if email service is operational

3. **Verify Redirect URLs**
   - Make sure redirect URLs in Supabase match exactly
   - URLs are case-sensitive
   - Must include protocol (https://)

4. **Check Spam Folder**
   - Supabase emails might go to spam
   - Check spam/junk folder
   - Add `noreply@mail.app.supabase.io` to contacts

### Confirmation Link Not Working

1. **Verify Redirect URL**
   - Check that `/auth/callback` page exists
   - Verify the page handles email confirmation tokens

2. **Check Token Expiry**
   - Email confirmation tokens expire after 24 hours by default
   - User needs to request a new confirmation email if expired

3. **Check Browser Console**
   - Open browser developer tools
   - Check for errors when clicking confirmation link

### Request New Confirmation Email

If a user didn't receive the email, they can:
1. Try signing in (will show "Email not confirmed" error)
2. Use "Resend confirmation email" option (if implemented)
3. Or sign up again with the same email

## Additional Configuration

### Custom Email Domain (Pro Feature)

If you want to send emails from your own domain:
1. Configure custom SMTP in Supabase
2. Set up SPF/DKIM records for your domain
3. Use your domain's email service

### Rate Limiting

Supabase has rate limits on email sending:
- Free tier: 3 emails/hour per user
- Pro tier: Higher limits
- Consider implementing custom email service for high volume

## Verification Checklist

- [ ] Email confirmation is enabled in Supabase
- [ ] Site URL is set correctly
- [ ] Redirect URLs are added and match exactly
- [ ] Code includes `emailRedirectTo` option
- [ ] `/auth/callback` page exists and works
- [ ] Test sign-up sends confirmation email
- [ ] Confirmation link redirects correctly
- [ ] User can confirm email and sign in

## Next Steps

After fixing the configuration:
1. Test the sign-up flow end-to-end
2. Monitor Supabase Auth Logs for any errors
3. Check email delivery rates
4. Consider implementing "Resend confirmation email" feature if needed

