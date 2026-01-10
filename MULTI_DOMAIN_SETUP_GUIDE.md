# Multi-Domain Deployment Setup Guide

This guide covers the manual configuration steps needed after code changes for multi-domain deployment.

## Overview

The application is split across three domains:
- **Main Domain**: `develloinc.com` - Contains all API routes and main application
- **Studios Domain**: `devellostudios.com` - Frontend-only for studios pages
- **Tech Domain**: `devellotech.com` - Frontend-only for software page

## Code Changes Completed

✅ CORS configuration updated in `lib/config.js` and `lib/middleware.js`
✅ API client utility created in `lib/apiClient.js`
✅ Main project navigation updated to link to new domains
✅ Studios pages updated to use API client and new SEO URLs
✅ Tech pages updated to use API client and new SEO URLs
✅ Studios components updated to use API client for cross-domain API calls

## Manual Configuration Steps

### 1. Vercel Project Setup

#### Create Studios Project
1. Go to Vercel Dashboard
2. Click "Add New Project"
3. Import the same GitHub repository
4. Configure project:
   - **Project Name**: `devello-studios`
   - **Framework Preset**: Next.js
   - **Root Directory**: `/` (same as main project)
5. Add domain `devellostudios.com` in project settings
6. Set environment variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://develloinc.com
   NEXT_PUBLIC_STUDIOS_DOMAIN=https://devellostudios.com
   NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your_stripe_key>
   ```
   (Copy all other environment variables from main project)

#### Create Tech Project
1. Go to Vercel Dashboard
2. Click "Add New Project"
3. Import the same GitHub repository
4. Configure project:
   - **Project Name**: `devello-tech`
   - **Framework Preset**: Next.js
   - **Root Directory**: `/` (same as main project)
5. Add domain `devellotech.com` in project settings
6. Set environment variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://develloinc.com
   NEXT_PUBLIC_TECH_DOMAIN=https://devellotech.com
   NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your_stripe_key>
   ```
   (Copy all other environment variables from main project)

### 2. DNS Configuration (GoDaddy)

For each domain (`devellostudios.com` and `devellotech.com`):

1. Log in to GoDaddy
2. Go to DNS Management for each domain
3. Vercel will provide DNS records during domain setup:
   - **Type**: A or CNAME
   - **Name**: @ (or www for subdomain)
   - **Value**: Vercel-provided IP or CNAME target
4. Add the records as provided by Vercel
5. SSL certificates are automatically provisioned by Vercel

### 3. Supabase Configuration

#### Update Redirect URLs
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Update **Site URL** to: `https://develloinc.com`
3. Add **Redirect URLs**:
   ```
   https://develloinc.com/auth/callback
   https://devellostudios.com/auth/callback
   https://devellotech.com/auth/callback
   http://localhost:3000/auth/callback (for development)
   ```

#### Update OAuth Providers
1. Go to Authentication > Providers > Google
2. Ensure redirect URLs include:
   - `https://develloinc.com/auth/callback`
   - `https://devellostudios.com/auth/callback`
   - `https://devellotech.com/auth/callback`
   - `https://<your-project>.supabase.co/auth/v1/callback`

### 4. Google Cloud Console Configuration

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Edit your OAuth 2.0 Client ID
3. Add **Authorized redirect URIs**:
   ```
   https://develloinc.com/auth/callback
   https://devellostudios.com/auth/callback
   https://devellotech.com/auth/callback
   https://<your-project>.supabase.co/auth/v1/callback
   ```

### 5. Stripe Configuration

#### Update Webhook URLs
1. Go to Stripe Dashboard > Developers > Webhooks
2. For each webhook endpoint, add:
   - `https://develloinc.com/api/webhooks/stripe` (main endpoint)
   - Ensure webhook is configured for the main domain only (API routes are there)

#### Update Checkout Success/Cancel URLs
Payment redirects are handled dynamically in code using `window.location.origin`, so they will automatically work on all domains.

### 6. Testing Checklist

After deployment, test the following:

#### Studios Domain (devellostudios.com)
- [ ] Homepage loads and redirects to `/studios`
- [ ] `/studios` page loads correctly
- [ ] `/lighting` page loads and API calls work
- [ ] `/assisted-edit` page loads and API calls work
- [ ] `/general-edit` page loads and API calls work
- [ ] Authentication works (sign in/out)
- [ ] Payment flows work
- [ ] Navigation links to main domain work

#### Tech Domain (devellotech.com)
- [ ] Homepage loads and redirects to `/software`
- [ ] `/software` page loads correctly
- [ ] API calls work (if any)
- [ ] Authentication works
- [ ] Navigation links to main domain work

#### Main Domain (develloinc.com)
- [ ] All existing functionality works
- [ ] Links to studios domain work (`devellostudios.com`)
- [ ] Links to tech domain work (`devellotech.com`)
- [ ] API routes are accessible from studios/tech domains (check CORS)

### 7. Environment Variables Summary

#### Main Project (develloinc.com)
- All existing environment variables
- No changes needed

#### Studios Project (devellostudios.com)
- `NEXT_PUBLIC_API_BASE_URL=https://develloinc.com` ⚠️ **Required**
- `NEXT_PUBLIC_STUDIOS_DOMAIN=https://devellostudios.com`
- All Supabase/Stripe client-side keys
- All other environment variables from main project

#### Tech Project (devellotech.com)
- `NEXT_PUBLIC_API_BASE_URL=https://develloinc.com` ⚠️ **Required**
- `NEXT_PUBLIC_TECH_DOMAIN=https://devellotech.com`
- All Supabase/Stripe client-side keys
- All other environment variables from main project

## Notes

- All three projects share the same codebase (same GitHub repo)
- API routes remain in main project only
- Studios and Tech projects are frontend-only and call APIs on main domain
- CORS is configured to allow cross-origin requests from new domains
- Authentication works across all domains via Supabase
- Payment flows work on all domains (redirects use `window.location.origin`)

## Troubleshooting

### CORS Errors
- Verify CORS configuration in `lib/config.js` includes new domains
- Check browser console for specific CORS error messages
- Ensure `NEXT_PUBLIC_API_BASE_URL` is set correctly in studios/tech projects

### Authentication Not Working
- Verify Supabase redirect URLs include all three domains
- Check Google Cloud Console OAuth redirect URIs
- Ensure `/auth/callback` page exists in all projects

### API Calls Failing
- Verify `NEXT_PUBLIC_API_BASE_URL` is set to `https://develloinc.com`
- Check that API client is being used (not direct fetch calls)
- Verify CORS headers are being sent correctly

### Domain Not Loading
- Check DNS records in GoDaddy
- Verify domain is added in Vercel project settings
- Wait for DNS propagation (can take up to 48 hours)

