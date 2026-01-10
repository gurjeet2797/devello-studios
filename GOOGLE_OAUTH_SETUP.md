# Google OAuth Setup Guide for Devello Inc

This guide will help you set up Google OAuth authentication for your Devello Inc application using Supabase.

## Prerequisites

- A Supabase project (already configured)
- A Google Cloud Console account
- Your application running locally or deployed

## Step 1: Set up Google OAuth in Google Cloud Console

### 1.1 Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

### 1.2 Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace)
3. Fill in the required information:
   - **App name**: Devello Inc
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Add test users (your email addresses for testing)

### 1.3 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Set the following redirect URIs:
   - For development: `http://localhost:3000/auth/callback`
   - For production: `https://your-domain.com/auth/callback`
   - Supabase callback: `https://your-project.supabase.co/auth/v1/callback`
5. Note down your **Client ID** and **Client Secret**

## Step 2: Configure Supabase Authentication

### 2.1 Enable Google Provider in Supabase
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click **Enable**
4. Enter your Google OAuth credentials:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
5. Set the redirect URL to: `https://your-project.supabase.co/auth/v1/callback`
6. Save the configuration

### 2.2 Configure Site URL
1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Set **Site URL** to your application URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`

## Step 3: Environment Variables

Make sure your environment variables are properly configured:

```bash
# .env.local (for development)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# .env.production (for production)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

## Step 4: Test the Integration

### 4.1 Local Testing
1. Start your development server: `npm run dev`
2. Click the "Continue with Google" button
3. You should be redirected to Google's OAuth consent screen
4. After authorization, you'll be redirected back to your app

### 4.2 Production Testing
1. Deploy your application
2. Update the redirect URIs in Google Cloud Console
3. Test the Google Sign-In flow

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Ensure all redirect URIs are properly configured in Google Cloud Console
   - Check that the Supabase callback URL is included

2. **"invalid_client" error**
   - Verify your Client ID and Client Secret are correct
   - Make sure you're using the right credentials for the environment

3. **"access_denied" error**
   - Check that your email is added as a test user in OAuth consent screen
   - Verify the OAuth consent screen is properly configured

4. **Callback not working**
   - Ensure the `/auth/callback` page exists in your Next.js app
   - Check that the redirect URL in Supabase matches your app URL

### Debug Steps

1. Check browser console for errors
2. Verify Supabase logs in the dashboard
3. Test with different browsers/devices
4. Ensure all environment variables are loaded correctly

## Security Considerations

1. **Never expose Client Secret in client-side code**
2. **Use environment variables for all sensitive data**
3. **Implement proper error handling**
4. **Add rate limiting for authentication endpoints**
5. **Regularly rotate OAuth credentials**

## Additional Features

Once Google OAuth is working, you can:

1. **Add user profile information** from Google
2. **Implement role-based access control**
3. **Add additional OAuth providers** (GitHub, Discord, etc.)
4. **Create user onboarding flows**
5. **Add social login analytics**

## Support

If you encounter issues:

1. Check the [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
2. Review [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2)
3. Check the [Next.js documentation](https://nextjs.org/docs) for routing issues
4. Review your browser's network tab for failed requests

---

**Note**: This setup guide assumes you're using the current version of Supabase and Next.js. Always refer to the latest documentation for the most up-to-date instructions.
