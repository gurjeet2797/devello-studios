# Environment Variables Setup for Multi-Domain

## Critical Environment Variable

You need to set `NEXT_PUBLIC_DOMAIN_TYPE` in each Vercel project to tell the application which domain it's running on.

## Setup Instructions

### Main Project (develloinc.com)

1. Go to Vercel Dashboard → **devello-main** project
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Key**: `NEXT_PUBLIC_DOMAIN_TYPE`
   - **Value**: `main`
   - **Environment**: Production, Preview, Development (select all)
4. Click **Save**

### Studios Project (devellostudios.com)

1. Go to Vercel Dashboard → **devello-studios** project
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Key**: `NEXT_PUBLIC_DOMAIN_TYPE`
   - **Value**: `studios`
   - **Environment**: Production, Preview, Development (select all)
4. Click **Save**

### Tech Project (devellotech.com)

1. Go to Vercel Dashboard → **devello-tech** project
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Key**: `NEXT_PUBLIC_DOMAIN_TYPE`
   - **Value**: `tech`
   - **Environment**: Production, Preview, Development (select all)
4. Click **Save**

## After Adding Variables

1. **Redeploy each project**:
   - Go to project → **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**
   - Or push a new commit to trigger auto-deploy

2. **Verify it works**:
   - `devellostudios.com` should show Studios page immediately
   - `devellotech.com` should show Software page immediately
   - `develloinc.com` should show Welcome page

## How It Works

The `pages/index.js` file now uses `getServerSideProps` to:
1. First check `NEXT_PUBLIC_DOMAIN_TYPE` environment variable
2. If not set, fallback to detecting from request hostname
3. Render the correct page on server-side (no client-side flash)

## Fallback Behavior

If `NEXT_PUBLIC_DOMAIN_TYPE` is not set, the code will automatically detect from the request hostname:
- `devellostudios.com` → `studios`
- `devellotech.com` → `tech`
- Everything else → `main`

But setting the environment variable is **recommended** for reliability and performance.

## Quick Checklist

- [ ] `NEXT_PUBLIC_DOMAIN_TYPE=main` in main project
- [ ] `NEXT_PUBLIC_DOMAIN_TYPE=studios` in studios project
- [ ] `NEXT_PUBLIC_DOMAIN_TYPE=tech` in tech project
- [ ] All projects redeployed
- [ ] Tested all three domains

