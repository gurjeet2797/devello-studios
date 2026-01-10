# Newsletter RLS Setup Guide

The newsletter subscription is currently working with temporary storage (logging only). To enable proper database storage, you need to set up Row Level Security (RLS) policies in your Supabase dashboard.

## 🔧 Manual RLS Setup

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Policies**

### Step 2: Find the newsletter_subscribers Table
1. Look for the `newsletter_subscribers` table
2. If it's not visible, go to **Table Editor** → **newsletter_subscribers**

### Step 3: Create RLS Policies

#### Policy 1: Allow Public Newsletter Subscriptions (INSERT)
1. Click **"New Policy"** for the `newsletter_subscribers` table
2. Choose **"For full customization"**
3. Set the following:
   - **Policy name**: `Allow public newsletter subscriptions`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `public`
   - **Policy definition**: `true`
4. Click **"Save"**

#### Policy 2: Allow Public Newsletter Reads (SELECT)
1. Click **"New Policy"** again
2. Choose **"For full customization"**
3. Set the following:
   - **Policy name**: `Allow public newsletter reads`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public`
   - **Policy definition**: `true`
4. Click **"Save"**

### Step 4: Enable RLS (if not already enabled)
1. In the **Table Editor**, go to `newsletter_subscribers`
2. Click the **"Settings"** tab
3. Enable **"Row Level Security"**

## 🧪 Testing

After setting up the policies:

1. **Test the newsletter subscription** on your website
2. **Check the database** to verify emails are being stored
3. **Check the console logs** for any remaining errors

## 🔄 Re-enable Database Storage

Once RLS policies are set up, update the newsletter API to use database storage:

```javascript
// In pages/api/newsletter/subscribe.js
// Remove the temporary return and uncomment the database insertion code
```

## 📝 SQL Commands (Alternative)

If you prefer to use SQL directly:

```sql
-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy
CREATE POLICY "Allow public newsletter subscriptions" 
ON newsletter_subscribers 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Create SELECT policy
CREATE POLICY "Allow public newsletter reads" 
ON newsletter_subscribers 
FOR SELECT 
TO public 
USING (true);
```

## ✅ Verification

After setup, you should see:
- Newsletter subscriptions working without errors
- Emails being stored in the `newsletter_subscribers` table
- No more "permission denied" errors in the console

## 🆘 Troubleshooting

### Common Issues:
1. **"permission denied"** - RLS policies not set up correctly
2. **"table does not exist"** - Run `node scripts/create-newsletter-table.js`
3. **"function not found"** - Use the Supabase dashboard instead of SQL

### Quick Fix:
If you're still having issues, the current temporary approach (logging only) will work for testing the UI, and you can set up proper storage later.
