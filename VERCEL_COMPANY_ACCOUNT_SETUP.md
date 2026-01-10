# Complete Vercel Company Account Setup Guide

This guide will walk you through setting up a new Vercel company account and deploying all three domains (develloinc.com, devellostudios.com, devellotech.com).

## Prerequisites

- Access to your GitHub repository
- Access to GoDaddy DNS management for all three domains
- Access to Supabase dashboard
- Access to Google Cloud Console (for OAuth)
- Access to Stripe dashboard (for webhooks)

---

## Step 1: Create New Vercel Company Account

### 1.1 Sign Up for Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended) or your preferred method
4. **Important**: Use your company email address, not personal
5. Complete the sign-up process

### 1.2 Create/Join Team (Optional but Recommended)
1. In Vercel dashboard, go to **Settings** > **Teams**
2. Click **"Create Team"** or **"Join Team"**
3. Name it something like "Devello Inc" or your company name
4. This allows multiple team members to access projects later

---

## Step 2: Connect GitHub Repository

### 2.1 Import Repository
1. In Vercel dashboard, click **"Add New..."** > **"Project"**
2. Click **"Import Git Repository"**
3. Find and select your repository
4. If repository is private, authorize Vercel to access it
5. Click **"Import"**

### 2.2 Configure Repository Settings
1. **Project Name**: `devello-main` (or your preferred name)
2. **Framework Preset**: Next.js (should auto-detect)
3. **Root Directory**: `/` (leave as default)
4. **Build Command**: `npm run build` (default)
5. **Output Directory**: `.next` (default)
6. **Install Command**: `npm install` (default)

**DO NOT deploy yet** - We'll create all three projects first, then configure them.

---

## Step 3: Create Three Separate Projects

You'll create three projects from the same repository, each configured for a different domain.

### 3.1 Create Main Project (develloinc.com)

1. **First Project Setup**:
   - **Project Name**: `devello-main`
   - **Framework**: Next.js
   - **Root Directory**: `/`
   - Click **"Deploy"** (we'll configure domain after)

2. **After initial deployment**, go to **Settings** > **Domains**
3. Click **"Add Domain"**
4. Enter: `develloinc.com`
5. Also add: `www.develloinc.com` (optional but recommended)
6. Vercel will show DNS records - **save these for later** (Step 6)

### 3.2 Create Studios Project (devellostudios.com)

1. Go back to **Dashboard**
2. Click **"Add New..."** > **"Project"**
3. Select the **same repository**
4. Configure:
   - **Project Name**: `devello-studios`
   - **Framework**: Next.js
   - **Root Directory**: `/`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
5. Click **"Deploy"**

6. **After deployment**, go to **Settings** > **Domains**
7. Click **"Add Domain"**
8. Enter: `devellostudios.com`
9. Also add: `www.devellostudios.com`
10. **Save DNS records**

### 3.3 Create Tech Project (devellotech.com)

1. Go back to **Dashboard**
2. Click **"Add New..."** > **"Project"**
3. Select the **same repository**
4. Configure:
   - **Project Name**: `devello-tech`
   - **Framework**: Next.js
   - **Root Directory**: `/`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
5. Click **"Deploy"**

6. **After deployment**, go to **Settings** > **Domains**
7. Click **"Add Domain"**
8. Enter: `devellotech.com`
9. Also add: `www.devellotech.com`
10. **Save DNS records**

---

## Step 4: Configure Environment Variables

### 4.1 Main Project (develloinc.com) Environment Variables

1. Go to **devello-main** project
2. Navigate to **Settings** > **Environment Variables**
3. Add all your existing environment variables:

**Required Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
DATABASE_URL=<your_database_url>
REPLICATE_API_TOKEN=<your_replicate_token>
STRIPE_SECRET_KEY=<your_stripe_secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable>
STRIPE_WEBHOOK_SECRET=<your_webhook_secret>
GOOGLE_API_KEY=<your_google_api_key>
```

**Email/SMTP Variables:**
```
SMTP_HOST=<your_smtp_host>
SMTP_PORT=<your_smtp_port>
SMTP_USER=<your_smtp_user>
SMTP_PASS=<your_smtp_password>
FROM_EMAIL=<your_from_email>
SALES_EMAIL=<your_sales_email>
ADMIN_EMAIL=<your_admin_email>
```

**Base URL (Important):**
```
NEXT_PUBLIC_BASE_URL=https://develloinc.com
NEXT_PUBLIC_SITE_URL=https://develloinc.com
```

4. Set each variable for **Production**, **Preview**, and **Development** environments
5. Click **"Save"** after adding each variable

### 4.2 Studios Project (devellostudios.com) Environment Variables

1. Go to **devello-studios** project
2. Navigate to **Settings** > **Environment Variables**
3. Add the same variables as main project, **BUT** with these changes:

**Critical Changes:**
```
NEXT_PUBLIC_API_BASE_URL=https://develloinc.com
NEXT_PUBLIC_STUDIOS_DOMAIN=https://devellostudios.com
NEXT_PUBLIC_BASE_URL=https://devellostudios.com
NEXT_PUBLIC_SITE_URL=https://devellostudios.com
```

**Keep all other variables the same:**
- All Supabase variables
- All Stripe variables (client-side keys)
- All API keys
- All SMTP variables (if needed)

### 4.3 Tech Project (devellotech.com) Environment Variables

1. Go to **devello-tech** project
2. Navigate to **Settings** > **Environment Variables**
3. Add the same variables, **BUT** with these changes:

**Critical Changes:**
```
NEXT_PUBLIC_API_BASE_URL=https://develloinc.com
NEXT_PUBLIC_TECH_DOMAIN=https://devellotech.com
NEXT_PUBLIC_BASE_URL=https://devellotech.com
NEXT_PUBLIC_SITE_URL=https://devellotech.com
```

**Keep all other variables the same**

---

## Step 5: Configure Build Settings (Optional but Recommended)

### 5.1 For Each Project

1. Go to **Settings** > **General**
2. Scroll to **Build & Development Settings**
3. Ensure:
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
   - **Node.js Version**: 18.x or 20.x (check your package.json)

4. For **Studios** and **Tech** projects, you might want to add build environment variables:
   - Go to **Settings** > **Environment Variables**
   - Add build-time variables if needed

---

## Step 6: Configure DNS in GoDaddy

### 6.1 For develloinc.com

1. Log in to GoDaddy
2. Go to **My Products** > **Domains**
3. Find `develloinc.com` and click **"DNS"**
4. Vercel provided DNS records - add them:

**Option A: Use CNAME (Recommended)**
- **Type**: CNAME
- **Name**: @
- **Value**: `cname.vercel-dns.com` (or what Vercel provided)
- **TTL**: 600 (or default)

**Option B: Use A Records**
- **Type**: A
- **Name**: @
- **Value**: Vercel IP address (provided by Vercel)
- **TTL**: 600

5. For `www` subdomain:
   - **Type**: CNAME
   - **Name**: www
   - **Value**: `cname.vercel-dns.com` (or Vercel provided value)

6. **Save** changes
7. Wait 5-10 minutes, then verify in Vercel dashboard that domain is connected

### 6.2 For devellostudios.com

1. Repeat steps 1-3 for `devellostudios.com`
2. Add DNS records provided by Vercel for studios project
3. **Important**: Use the DNS records from the **devello-studios** project, not main
4. Save and wait for propagation

### 6.3 For devellotech.com

1. Repeat steps 1-3 for `devellotech.com`
2. Add DNS records provided by Vercel for tech project
3. **Important**: Use the DNS records from the **devello-tech** project
4. Save and wait for propagation

**DNS Propagation Time**: Can take 5 minutes to 48 hours, typically 15-30 minutes

---

## Step 7: Update External Service Configurations

### 7.1 Supabase Configuration

1. Go to Supabase Dashboard > **Authentication** > **URL Configuration**

2. **Site URL**: Set to `https://develloinc.com`

3. **Redirect URLs** - Add all three:
   ```
   https://develloinc.com/auth/callback
   https://devellostudios.com/auth/callback
   https://devellotech.com/auth/callback
   http://localhost:3000/auth/callback
   ```

4. **Save** changes

### 7.2 Google Cloud Console (OAuth)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID and click **Edit**

4. **Authorized redirect URIs** - Add all:
   ```
   https://develloinc.com/auth/callback
   https://devellostudios.com/auth/callback
   https://devellotech.com/auth/callback
   https://<your-project>.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```

5. **Save** changes

### 7.3 Stripe Webhooks

1. Go to Stripe Dashboard > **Developers** > **Webhooks**
2. Find your webhook endpoint
3. **URL**: Should be `https://develloinc.com/api/webhooks/stripe` (main domain only)
4. **Events**: Ensure all necessary events are selected
5. **Note**: Webhooks only need to point to main domain since API routes are there

---

## Step 8: Trigger New Deployments

After configuring environment variables and DNS:

### 8.1 For Each Project

1. Go to project dashboard
2. Click **"Deployments"** tab
3. Click the **"..."** menu on latest deployment
4. Click **"Redeploy"**
5. Or push a new commit to trigger automatic deployment

### 8.2 Verify Deployments

1. Check that all three projects show **"Ready"** status
2. Verify domains show as **"Valid"** in project settings
3. Check build logs for any errors

---

## Step 9: Testing Checklist

### 9.1 Main Domain (develloinc.com)

- [ ] Homepage loads
- [ ] Navigation works
- [ ] Links to studios domain work (`devellostudios.com`)
- [ ] Links to tech domain work (`devellotech.com`)
- [ ] API routes work (`/api/*`)
- [ ] Authentication works (sign in/out)
- [ ] All existing features work

### 9.2 Studios Domain (devellostudios.com)

- [ ] Homepage loads (should redirect to `/studios` or show studios page)
- [ ] `/studios` page loads
- [ ] `/lighting` page loads
- [ ] `/assisted-edit` page loads
- [ ] `/general-edit` page loads
- [ ] API calls work (check browser console for CORS errors)
- [ ] Authentication works
- [ ] Payment flows work
- [ ] Navigation links to main domain work

### 9.3 Tech Domain (devellotech.com)

- [ ] Homepage loads (should redirect to `/software` or show software page)
- [ ] `/software` page loads
- [ ] API calls work (if any)
- [ ] Authentication works
- [ ] Navigation links to main domain work

---

## Step 10: Update Old Vercel Account (If Needed)

### 10.1 Transfer Domain Ownership (Optional)

If you want to keep the old account for reference:
1. Keep it as-is for now
2. Update DNS to point to new Vercel projects
3. Old deployments will stop working once DNS changes

### 10.2 Archive Old Projects (Optional)

1. In old Vercel account, go to project settings
2. You can delete or archive old projects
3. **Important**: Make sure new deployments are working first!

---

## Troubleshooting

### Domain Not Connecting

1. **Check DNS Records**:
   - Verify records are correct in GoDaddy
   - Wait for DNS propagation (can take up to 48 hours)
   - Use `dig` or `nslookup` to check DNS resolution

2. **Check Vercel Domain Status**:
   - Go to project > Settings > Domains
   - Check for error messages
   - Verify SSL certificate is issued (automatic)

### Build Failures

1. **Check Environment Variables**:
   - Ensure all required variables are set
   - Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly for studios/tech projects

2. **Check Build Logs**:
   - Go to deployment > View build logs
   - Look for missing environment variables or build errors

### CORS Errors

1. **Verify CORS Configuration**:
   - Check `lib/config.js` includes new domains
   - Verify `NEXT_PUBLIC_API_BASE_URL` is set to `https://develloinc.com` in studios/tech projects

2. **Check Browser Console**:
   - Look for specific CORS error messages
   - Verify API calls are using the API client utility

### Authentication Not Working

1. **Check Supabase Configuration**:
   - Verify redirect URLs include all three domains
   - Check Site URL is set correctly

2. **Check Google OAuth**:
   - Verify redirect URIs include all three domains
   - Check OAuth consent screen settings

---

## Quick Reference: Environment Variables by Project

### Main Project (develloinc.com)
```
NEXT_PUBLIC_BASE_URL=https://develloinc.com
NEXT_PUBLIC_SITE_URL=https://develloinc.com
[All other variables]
```

### Studios Project (devellostudios.com)
```
NEXT_PUBLIC_API_BASE_URL=https://develloinc.com ⚠️ CRITICAL
NEXT_PUBLIC_STUDIOS_DOMAIN=https://devellostudios.com
NEXT_PUBLIC_BASE_URL=https://devellostudios.com
NEXT_PUBLIC_SITE_URL=https://devellostudios.com
[All other variables - same as main]
```

### Tech Project (devellotech.com)
```
NEXT_PUBLIC_API_BASE_URL=https://develloinc.com ⚠️ CRITICAL
NEXT_PUBLIC_TECH_DOMAIN=https://devellotech.com
NEXT_PUBLIC_BASE_URL=https://devellotech.com
NEXT_PUBLIC_SITE_URL=https://devellotech.com
[All other variables - same as main]
```

---

## Next Steps After Setup

1. **Monitor Deployments**: Check that all three projects deploy successfully
2. **Test Thoroughly**: Go through the testing checklist above
3. **Update Documentation**: Update any internal docs with new URLs
4. **Set Up Monitoring**: Consider adding Vercel Analytics or other monitoring
5. **Team Access**: Add team members to Vercel team if needed

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **DNS Troubleshooting**: https://vercel.com/docs/concepts/projects/domains/troubleshooting

---

**Estimated Time**: 2-4 hours (including DNS propagation wait time)

**Critical Success Factors**:
1. ✅ All three projects created from same repository
2. ✅ Environment variables set correctly (especially `NEXT_PUBLIC_API_BASE_URL`)
3. ✅ DNS records configured correctly in GoDaddy
4. ✅ Supabase and Google OAuth redirect URLs updated
5. ✅ All domains verified in Vercel dashboard

