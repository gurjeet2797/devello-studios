# Newsletter Database Storage Setup

This guide will help you set up proper database storage for newsletter subscriptions.

## 🎯 Current Status

- ✅ Newsletter subscription works (temporary logging)
- ✅ Database table exists (`newsletter_subscribers`)
- ❌ RLS policies not configured (permission denied)
- 🔄 API ready to use database storage once policies are set

## 🔧 Setup Steps

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (in the left sidebar)

### Step 2: Run SQL Commands

Copy and paste this SQL into the SQL Editor and click **"Run"**:

```sql
-- Enable Row Level Security
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for public newsletter subscriptions (INSERT)
CREATE POLICY "Allow public newsletter subscriptions"
ON newsletter_subscribers
FOR INSERT
TO public
WITH CHECK (true);

-- Create policy for public newsletter reads (SELECT)
CREATE POLICY "Allow public newsletter reads"
ON newsletter_subscribers
FOR SELECT
TO public
USING (true);
```

### Step 3: Verify Setup

Run this command to test the setup:

```bash
node scripts/setup-newsletter-database.js
```

You should see:
```
✅ Database connection successful!
🎉 Newsletter database storage is ready!
```

### Step 4: Test Newsletter Subscription

1. Go to your website
2. Scroll to the newsletter section
3. Enter an email and click Subscribe
4. Check the console logs - you should see:
   ```
   ✅ Newsletter subscription successful: [database record]
   ```

## 🧪 Testing

### Test Database Storage

```bash
# Test the database setup
node scripts/setup-newsletter-database.js

# Test the newsletter API
curl -X POST http://localhost:3000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Check Database Records

1. Go to Supabase Dashboard
2. Navigate to **Table Editor**
3. Select `newsletter_subscribers` table
4. You should see the subscribed emails

## 🔍 Troubleshooting

### "Permission denied" Error

**Cause**: RLS policies not set up
**Solution**: Run the SQL commands in Step 2

### "Table does not exist" Error

**Cause**: Newsletter table not created
**Solution**: Run `node scripts/create-newsletter-table.js`

### "Policy already exists" Error

**Cause**: Policies already created
**Solution**: This is fine, the setup is complete

## 📊 Database Schema

The `newsletter_subscribers` table has these columns:

- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR, UNIQUE)
- `subscribed_at` (TIMESTAMP)
- `status` (VARCHAR, default: 'active')
- `unsubscribed_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 🚀 Next Steps

Once database storage is working:

1. **Monitor subscriptions** in Supabase dashboard
2. **Set up email marketing** integration (SendGrid, Mailchimp, etc.)
3. **Create unsubscribe functionality**
4. **Add analytics** for subscription rates

## 📝 API Endpoints

- **Subscribe**: `POST /api/newsletter/subscribe`
- **Body**: `{ "email": "user@example.com" }`
- **Response**: Success/error message

## ✅ Success Indicators

After setup, you should see:

- ✅ Newsletter subscriptions stored in database
- ✅ No more "permission denied" errors
- ✅ Console logs show database records
- ✅ Emails visible in Supabase Table Editor

## 🆘 Need Help?

If you're still having issues:

1. Check the Supabase dashboard for any error messages
2. Verify the SQL commands were executed successfully
3. Run the test script to verify setup
4. Check the browser console for any remaining errors
