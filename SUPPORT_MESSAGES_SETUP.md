# Support Messages Database Setup

This guide will help you set up the support_messages table for the contact form functionality.

## 🎯 Current Status

- ❌ Contact form failing (500 error)
- ❌ support_messages table doesn't exist
- 🔄 Need to create table and set up RLS policies

## 🔧 Setup Steps

### Step 1: Create the Table

Run the setup script:

```bash
node scripts/setup-support-messages.js
```

### Step 2: Manual SQL Setup (if script fails)

If the script doesn't work, run this SQL in your Supabase dashboard:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (in the left sidebar)
4. Copy and paste this SQL:

```sql
-- Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for public support message submissions (INSERT)
CREATE POLICY "Allow public support messages"
ON support_messages
FOR INSERT
TO public
WITH CHECK (true);

-- Create policy for admin access (SELECT)
CREATE POLICY "Allow admin to read support messages"
ON support_messages
FOR SELECT
TO authenticated
USING (true);
```

### Step 3: Verify Setup

Run the setup script again to test:

```bash
node scripts/setup-support-messages.js
```

You should see:
```
✅ Table access successful!
✅ Support message test successful!
🎉 Support messages table is now working!
```

### Step 4: Test Contact Form

1. Go to `/contact` on your website
2. Fill out the contact form
3. Submit the form
4. Check the console - you should see:
   ```
   ✅ Contact form submission successful: [database record]
   ```

## 🧪 Testing

### Test Database Storage

```bash
# Test the database setup
node scripts/setup-support-messages.js

# Test the contact form API
curl -X POST http://localhost:3000/api/contact/send \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","subject":"Test","message":"Test message"}'
```

### Check Database Records

1. Go to Supabase Dashboard
2. Navigate to **Table Editor**
3. Select `support_messages` table
4. You should see the submitted messages

## 🔍 Troubleshooting

### "Table does not exist" Error

**Cause**: support_messages table not created
**Solution**: Run the SQL commands in Step 2

### "Permission denied" Error

**Cause**: RLS policies not set up
**Solution**: Run the RLS policy SQL commands in Step 2

### "Policy already exists" Error

**Cause**: Policies already created
**Solution**: This is fine, the setup is complete

## 📊 Database Schema

The `support_messages` table has these columns:

- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(255))
- `email` (VARCHAR(255))
- `subject` (VARCHAR(500))
- `message` (TEXT)
- `status` (VARCHAR(20), default: 'new')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 🚀 Next Steps

Once the table is working:

1. **Monitor support messages** in Supabase dashboard
2. **Set up email notifications** for new support messages
3. **Create admin interface** to manage support tickets
4. **Add status tracking** (new, in_progress, resolved, closed)

## 📝 API Endpoints

- **Submit Support Message**: `POST /api/contact/send`
- **Body**: `{ "name": "User Name", "email": "user@example.com", "subject": "Subject", "message": "Message" }`
- **Response**: Success/error message

## ✅ Success Indicators

After setup, you should see:

- ✅ Contact form submissions stored in database
- ✅ No more 500 errors on contact form
- ✅ Console logs show database records
- ✅ Messages visible in Supabase Table Editor

## 🆘 Need Help?

If you're still having issues:

1. Check the Supabase dashboard for any error messages
2. Verify the SQL commands were executed successfully
3. Run the test script to verify setup
4. Check the browser console for any remaining errors
