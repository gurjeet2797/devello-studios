# Deployment Guide - Multi-Domain Setup

## How It Works

**One codebase → Three Vercel projects → Three domains**

All three Vercel projects are connected to the **same GitHub repository**. When you push to `master` (or `main`), all three projects automatically deploy.

## Deployment Process

### 1. Push to Master Branch

```bash
git add .
git commit -m "Update domain routing"
git push origin master
```

That's it! All three projects will automatically deploy.

### 2. Automatic Deployment

Vercel will:
1. Detect the push to master branch
2. Trigger builds for all three projects:
   - `devello-main` (develloinc.com)
   - `devello-studios` (devellostudios.com)
   - `devello-tech` (devellotech.com)
3. Each project uses the same code but different environment variables
4. The middleware automatically detects which domain it's on and routes accordingly

## How Domain Detection Works

The `middleware.js` file checks the request hostname:

```javascript
const hostname = request.headers.get('host');
const isStudiosDomain = hostname.includes('devellostudios.com');
const isTechDomain = hostname.includes('devellotech.com');
```

So the same codebase automatically:
- Shows Studios page on `devellostudios.com`
- Shows Software page on `devellotech.com`
- Shows Welcome page on `develloinc.com`
- Redirects `/studios` and `/software` on main domain

## Environment Variables (Per Project)

Each Vercel project has its own environment variables:

### Main Project (develloinc.com)
```
NEXT_PUBLIC_BASE_URL=https://develloinc.com
[All other variables]
```

### Studios Project (devellostudios.com)
```
NEXT_PUBLIC_API_BASE_URL=https://develloinc.com ⚠️ CRITICAL
NEXT_PUBLIC_STUDIOS_DOMAIN=https://devellostudios.com
NEXT_PUBLIC_BASE_URL=https://devellostudios.com
[All other variables - same as main]
```

### Tech Project (devellotech.com)
```
NEXT_PUBLIC_API_BASE_URL=https://develloinc.com ⚠️ CRITICAL
NEXT_PUBLIC_TECH_DOMAIN=https://devellotech.com
NEXT_PUBLIC_BASE_URL=https://devellotech.com
[All other variables - same as main]
```

**Important**: Environment variables are set in each Vercel project's settings, not in the code.

## Deployment Workflow

### Standard Deployment
1. Make code changes
2. Commit and push to `master`
3. All 3 projects auto-deploy
4. Done!

### Selective Deployment (If Needed)
If you want to deploy only one project:
1. Go to Vercel dashboard
2. Select the project
3. Go to "Deployments" tab
4. Click "Redeploy" on latest deployment

### Preview Deployments
- Pull requests create preview deployments for all 3 projects
- Each preview gets a unique URL
- Test before merging to master

## Verifying Deployments

### Check All Three Projects
1. Go to Vercel dashboard
2. You'll see all 3 projects listed
3. Each shows deployment status:
   - ✅ Ready (deployed successfully)
   - ⏳ Building (in progress)
   - ❌ Error (check logs)

### Test Each Domain
After deployment:
- `https://develloinc.com` - Should show Welcome page
- `https://devellostudios.com` - Should show Studios page
- `https://devellotech.com` - Should show Software page

## Deployment Best Practices

### 1. Always Test Locally First
```bash
npm run dev
# Test on localhost:3000
```

### 2. Use Feature Branches
```bash
git checkout -b feature/new-feature
# Make changes
git push origin feature/new-feature
# Creates preview deployment
# Test preview URL
# Merge to master when ready
```

### 3. Monitor Deployments
- Check Vercel dashboard after pushing
- Review build logs if deployment fails
- Test each domain after deployment

### 4. Environment Variables
- Never commit `.env` files
- Set variables in Vercel dashboard
- Use different values per project if needed

## Troubleshooting

### Deployment Fails for One Project
1. Check build logs in Vercel
2. Look for missing environment variables
3. Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly
4. Check for build errors in logs

### Wrong Content on Domain
1. Clear browser cache
2. Check middleware.js is in root directory
3. Verify domain detection in build logs
4. Check environment variables are correct

### All Projects Deploy But One Shows Wrong Content
- Check that project's environment variables
- Verify `NEXT_PUBLIC_BASE_URL` matches the domain
- Check middleware.js is deployed (should be automatic)

## Quick Reference

### Deploy Command
```bash
git push origin master
```

### Check Deployment Status
- Vercel Dashboard → Projects → [Project Name] → Deployments

### View Build Logs
- Vercel Dashboard → [Project] → [Deployment] → View Logs

### Environment Variables
- Vercel Dashboard → [Project] → Settings → Environment Variables

## Summary

✅ **One codebase** handles all 3 domains  
✅ **Push to master** deploys all 3 projects automatically  
✅ **Middleware** detects domain and routes accordingly  
✅ **Environment variables** are set per-project in Vercel  
✅ **No special deployment process** needed - just push!

The beauty of this setup: **Write once, deploy everywhere!** 🚀

