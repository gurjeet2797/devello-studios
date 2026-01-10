# Vercel Deployment Setup Guide

## Overview
This guide will help you configure Devello Inc for deployment on Vercel with proper environment variables and settings.

## Prerequisites
- Vercel account connected to your GitHub repository
- Supabase project with storage bucket configured
- Replicate API token

## Step 1: Vercel Project Configuration

### 1.1 Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository containing Devello Inc

### 1.2 Project Settings
- **Framework Preset**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## Step 2: Environment Variables Setup

### 2.1 Required Environment Variables
In your Vercel project dashboard, go to **Settings > Environment Variables** and add the following:

#### Database Configuration
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

#### Supabase Configuration
**IMPORTANT**: Client-side variables MUST have `NEXT_PUBLIC_` prefix
```
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
```

#### AI Service Configuration
```
REPLICATE_API_TOKEN=r8_[YOUR-REPLICATE-TOKEN]
```

#### Application Configuration
```
NODE_ENV=production
PRODUCTION_URL=https://[YOUR-VERCEL-DOMAIN].vercel.app
DEBUG_MODE=false
LOG_LEVEL=error
```

### 2.2 Environment Variable Sources
- **Production**: Set for production deployments
- **Preview**: Set for preview deployments (optional)
- **Development**: Set for local development (optional)

## Step 3: Supabase Configuration

### 3.1 Storage Bucket Setup
1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. Create a bucket named `images`
4. Set bucket to **Public**

### 3.2 Storage Policies
Run these SQL commands in your Supabase SQL Editor:

```sql
-- Allow public uploads
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images');

-- Allow public downloads
CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT USING (bucket_id = 'images');
```

### 3.3 Database Connection
1. Go to **Settings > Database** in Supabase
2. Copy the connection string
3. Update `DATABASE_URL` in Vercel environment variables

## Step 4: Replicate Configuration

### 4.1 Get API Token
1. Go to [Replicate Dashboard](https://replicate.com/account/api-tokens)
2. Create a new API token
3. Copy the token (starts with `r8_`)
4. Add to Vercel environment variables as `REPLICATE_API_TOKEN`

## Step 5: Vercel-Specific Optimizations

### 5.1 Function Configuration
The `vercel.json` file is already configured with:
- 30-second timeout for API functions
- 1024MB memory allocation
- Proper headers for API routes

### 5.2 Build Optimization
- Prisma client is generated during build
- Environment variables are validated at runtime
- Production optimizations are enabled

## Step 6: Deployment

### 6.1 Initial Deployment
1. Push your code to GitHub
2. Vercel will automatically trigger a deployment
3. Monitor the build logs for any errors

### 6.2 Post-Deployment Verification
1. Check that all environment variables are set correctly
2. Test file upload functionality
3. Test AI prediction endpoints
4. Verify Supabase storage is working

## Step 7: Monitoring and Debugging

### 7.1 Vercel Logs
- Go to your project dashboard
- Click on any deployment
- View function logs for debugging

### 7.2 Environment Variable Validation
The application includes built-in validation that will log errors if:
- Required environment variables are missing
- API tokens are invalid
- Database connection fails

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Set
**Error**: `Missing required environment variables`
**Solution**: Verify all environment variables are set in Vercel dashboard

#### 2. Supabase Connection Issues
**Error**: `Supabase Storage error: signature verification failed`
**Solution**: 
- Verify `SUPABASE_URL` and keys are correct
- Ensure storage bucket exists and is public
- Check storage policies are configured

#### 3. Replicate API Errors
**Error**: `REPLICATE_API_TOKEN may be invalid`
**Solution**:
- Verify token starts with `r8_`
- Check token has sufficient credits
- Ensure token is active

#### 4. Build Failures
**Error**: `Prisma generate failed`
**Solution**:
- Ensure `DATABASE_URL` is accessible
- Check database connection string format
- Verify database exists and is accessible

## Security Considerations

### 1. Environment Variables
- Never commit sensitive keys to Git
- Use Vercel's environment variable system
- Rotate keys regularly

### 2. API Access
- Use service role key only for server-side operations
- Use anon key for client-side operations
- Monitor API usage and costs

### 3. File Upload Security
- File type validation is enforced
- File size limits are configured
- Malicious file detection is implemented

## Performance Optimization

### 1. Vercel Edge Functions
- API routes use edge runtime where possible
- Optimized for low latency
- Automatic scaling

### 2. Image Processing
- Images are compressed before upload
- HEIC files are converted to JPEG
- Optimized for web delivery

### 3. Caching
- Static assets are cached
- API responses are cached where appropriate
- Database queries are optimized

## Support

For additional help:
- Check Vercel documentation: https://vercel.com/docs
- Review Supabase documentation: https://supabase.com/docs
- Check Replicate documentation: https://replicate.com/docs
