# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage to replace Vercel blob functionality.

## ✅ Current Status
- ✅ Supabase client integrated into `/api/upload`
- ✅ File upload processing working
- ✅ Console logging for debugging
- ⚠️ **Issue**: "signature verification failed" error

## 🔧 Setup Steps

### 1. Create Storage Bucket in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"Create bucket"**
5. Enter bucket name: `images`
6. ✅ Check **"Public bucket"** 
7. Click **"Create bucket"**

### 2. Set Up Storage Policies

After creating the bucket, you need to set up policies:

#### Option A: Simple Public Access (Recommended for Development)
1. In Storage section, click on `images` bucket
2. Go to **Policies** tab
3. Click **"Add policy"**
4. Create **INSERT** policy:
   - **Policy name**: `Allow public uploads`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `public`
   - **Policy definition**: `true`
5. Create **SELECT** policy:
   - **Policy name**: `Allow public downloads`  
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public`
   - **Policy definition**: `true`

#### Option B: Use Service Role Key (Recommended for Production)
1. In your Supabase Dashboard, go to **Settings** → **API**
2. Copy your **service_role** key (not the anon key)
3. Add it to your `.env` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### 3. Environment Variables

Make sure your `.env` file has:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Optional but recommended
```

## 🧪 Testing

### 1. Test Supabase Connection
```bash
npm run test-supabase
```

### 2. Test File Upload
1. Start the development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Try uploading an image
4. Check the console logs for detailed debugging information

### 3. Console Log Indicators

**✅ Success indicators:**
```
🚀 [UPLOAD] Uploading to Supabase Storage...
✅ [UPLOAD] File uploaded successfully to Supabase
🔗 [UPLOAD] Public URL generated: https://...
🎉 [UPLOAD] Upload completed successfully!
```

**❌ Error indicators:**
```
❌ [UPLOAD] Supabase Storage error: signature verification failed
```

## 🐛 Troubleshooting

### "signature verification failed" Error

This error usually means:

1. **Missing bucket**: Create the `images` bucket in Supabase dashboard
2. **Wrong permissions**: Set up public policies or use service role key
3. **Invalid keys**: Check your environment variables

### Steps to fix:
1. ✅ Create `images` bucket (public)
2. ✅ Add storage policies for INSERT/SELECT
3. ✅ Use service role key in `.env` file
4. 🔄 Restart development server

### Check if bucket exists:
```sql
-- Run in Supabase SQL Editor
SELECT name, public FROM storage.buckets WHERE name = 'images';
```

### Manual policy creation (SQL):
```sql
-- Allow public uploads
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images');

-- Allow public downloads  
CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT USING (bucket_id = 'images');
```

## 🎯 Next Steps

Once uploads are working:
1. Test with different image formats (PNG, JPEG, WebP)
2. Test file size limits
3. Verify public URLs are accessible
4. Test with your AI processing pipeline

## 📝 Notes

- Service role key bypasses RLS policies and has full access
- Anon key respects RLS policies and requires proper setup
- Public bucket means files are accessible via direct URL
- File names are prefixed with timestamp to avoid conflicts 