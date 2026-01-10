# Vercel Company Account Setup - Quick Checklist

Use this checklist alongside the detailed guide (`VERCEL_COMPANY_ACCOUNT_SETUP.md`).

## Pre-Setup
- [ ] Have access to GitHub repository
- [ ] Have access to GoDaddy for all 3 domains
- [ ] Have list of all environment variables ready
- [ ] Have access to Supabase, Google Cloud Console, Stripe dashboards

## Step 1: Vercel Account
- [ ] Create new Vercel account with company email
- [ ] Create/join team (optional)
- [ ] Verify account is active

## Step 2: Create Projects
- [ ] Import repository to Vercel
- [ ] Create **devello-main** project
- [ ] Create **devello-studios** project  
- [ ] Create **devello-tech** project
- [ ] All three projects deployed successfully

## Step 3: Add Domains
- [ ] Add `develloinc.com` to main project
- [ ] Add `www.develloinc.com` to main project
- [ ] Add `devellostudios.com` to studios project
- [ ] Add `www.devellostudios.com` to studios project
- [ ] Add `devellotech.com` to tech project
- [ ] Add `www.devellotech.com` to tech project
- [ ] **Save DNS records from each project**

## Step 4: Environment Variables - Main Project
- [ ] `NEXT_PUBLIC_BASE_URL=https://develloinc.com`
- [ ] `NEXT_PUBLIC_SITE_URL=https://develloinc.com`
- [ ] All Supabase variables
- [ ] All Stripe variables
- [ ] All API keys (Replicate, Google, etc.)
- [ ] All SMTP/Email variables
- [ ] Database URL
- [ ] All other existing variables

## Step 5: Environment Variables - Studios Project
- [ ] ⚠️ `NEXT_PUBLIC_API_BASE_URL=https://develloinc.com` (CRITICAL)
- [ ] `NEXT_PUBLIC_STUDIOS_DOMAIN=https://devellostudios.com`
- [ ] `NEXT_PUBLIC_BASE_URL=https://devellostudios.com`
- [ ] `NEXT_PUBLIC_SITE_URL=https://devellostudios.com`
- [ ] Copy all other variables from main project

## Step 6: Environment Variables - Tech Project
- [ ] ⚠️ `NEXT_PUBLIC_API_BASE_URL=https://develloinc.com` (CRITICAL)
- [ ] `NEXT_PUBLIC_TECH_DOMAIN=https://devellotech.com`
- [ ] `NEXT_PUBLIC_BASE_URL=https://devellotech.com`
- [ ] `NEXT_PUBLIC_SITE_URL=https://devellotech.com`
- [ ] Copy all other variables from main project

## Step 7: DNS Configuration - GoDaddy
- [ ] Configure DNS for `develloinc.com` (use main project DNS records)
- [ ] Configure DNS for `devellostudios.com` (use studios project DNS records)
- [ ] Configure DNS for `devellotech.com` (use tech project DNS records)
- [ ] Wait for DNS propagation (15-30 minutes, up to 48 hours)
- [ ] Verify domains show as "Valid" in Vercel dashboard

## Step 8: External Services
- [ ] **Supabase**: Update redirect URLs (all 3 domains)
- [ ] **Google Cloud Console**: Update OAuth redirect URIs (all 3 domains)
- [ ] **Stripe**: Verify webhook URL points to main domain

## Step 9: Redeploy
- [ ] Redeploy main project
- [ ] Redeploy studios project
- [ ] Redeploy tech project
- [ ] Verify all deployments successful

## Step 10: Testing
- [ ] develloinc.com homepage loads
- [ ] develloinc.com navigation works
- [ ] devellostudios.com loads
- [ ] devellostudios.com/lighting works
- [ ] devellostudios.com/assisted-edit works
- [ ] devellostudios.com/general-edit works
- [ ] devellotech.com loads
- [ ] devellotech.com/software works
- [ ] Authentication works on all 3 domains
- [ ] API calls work (no CORS errors)
- [ ] Payment flows work
- [ ] Cross-domain links work

## Critical Reminders
- ⚠️ `NEXT_PUBLIC_API_BASE_URL` MUST be `https://develloinc.com` for studios and tech projects
- ⚠️ Use correct DNS records from each Vercel project (they're different!)
- ⚠️ Wait for DNS propagation before testing
- ⚠️ Update Supabase and Google OAuth redirect URLs for all 3 domains

## Time Estimate
- **Setup**: 1-2 hours
- **DNS Propagation**: 15 minutes - 48 hours (usually 15-30 min)
- **Testing**: 30 minutes
- **Total**: 2-4 hours

