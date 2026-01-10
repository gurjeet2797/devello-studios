# Setup New Repository: Devello-studioscode

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `Devello-studioscode`
3. Description: "Devello Studios - AI-powered creative tools (lighting, image editor, assisted edit)"
4. Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

## Step 2: Initialize and Push Local Repository

Run these commands in your terminal (in the project directory):

```bash
# Check if git is already initialized
git status

# If not initialized, initialize git
git init
git branch -M main

# Stage all files
git add .

# Create initial commit
git commit -m "Initial commit: Devello Studios separated codebase

- Separated Studios from main domain
- Removed main domain pages and components  
- Simplified middleware for studios-only routing
- Updated navigation to use NavigationStudios
- Kept all tool functionality (lighting, general-edit, assisted-edit)
- Preserved shared infrastructure (Supabase, auth, API routes)"

# Add the new remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/Devello-studioscode.git

# Push to GitHub
git push -u origin main
```

## Step 3: Verify .env.local is Ignored

Make sure `.env.local` is in `.gitignore` (it should be - already checked ✅)

## Step 4: Add to Vercel

1. Go to https://vercel.com/new
2. Import the `Devello-studioscode` repository
3. Project name: `devello-studios` (or keep default)
4. Framework Preset: Next.js
5. Root Directory: `./` (default)
6. Build Command: `npm run build` (default)
7. Output Directory: `.next` (default)
8. Install Command: `npm install` (default)

## Step 5: Configure Environment Variables in Vercel

Add all the environment variables from your `.env.local` file:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `REPLICATE_API_TOKEN`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_BASIC_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_SINGLE_UPLOAD_PRICE_ID`
- `NEXT_PUBLIC_DOMAIN_TYPE=studios`
- `NEXT_PUBLIC_BASE_URL=https://devellostudios.com`

**Optional but recommended:**
- `GOOGLE_API_KEY`
- All other variables from your `.env.local`

## Step 6: Deploy and Update Domain

1. After deployment succeeds, go to Project Settings → Domains
2. Add `devellostudios.com` and `www.devellostudios.com`
3. Update DNS records to point to Vercel (if not already done)
4. The new deployment will be live on the Studios domain

## Notes

- `.env.local` is already in `.gitignore` ✅
- All sensitive files are excluded from git
- The codebase is now Studios-only and ready for deployment
