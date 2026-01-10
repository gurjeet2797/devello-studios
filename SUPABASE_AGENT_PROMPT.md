# Supabase Agent Prompt: Email Notification Toggle Error

## Problem Summary
Users are getting a 500 error when trying to toggle email notifications ON/OFF in the Client Portal Dashboard (`/client-portal`) and Partner Dashboard (`/partners`). The toggle makes a PUT request to `/api/user/notifications` or `/api/partners/notifications`, but the request fails with a 500 Internal Server Error.

## What We're Trying to Do
1. **For Users**: Update `user_profiles.email_notifications_enabled` field
2. **For Partners**: Update `partners.email_notifications_enabled` field

## Database Schema Details

### UserProfile Table (`user_profiles`)
```sql
- id: String (cuid, primary key)
- user_id: String (unique, references users.id)
- email_notifications_enabled: Boolean (default: false)
- first_name: String? (nullable)
- last_name: String? (nullable)
- created_at: DateTime
- updated_at: DateTime
```

### Partner Table (`partners`)
```sql
- id: String (uuid, primary key)
- user_id: String (unique, references users.id)
- email_notifications_enabled: Boolean (default: false)
- ... other fields
```

## API Endpoints

### User Notifications API: `/api/user/notifications`
**Method**: PUT
**Request Body**: `{ "emailNotificationsEnabled": true }`
**What it does**:
1. Authenticates user via Supabase token
2. Finds user in `users` table by `supabase_user_id`
3. Updates or creates `user_profiles` record with `email_notifications_enabled`

**Current Implementation**:
```javascript
// Check if profile exists
const existingProfile = await prisma.userProfile.findUnique({
  where: { user_id: user.id }
});

if (existingProfile) {
  // Update
  await prisma.userProfile.update({
    where: { user_id: user.id },
    data: { email_notifications_enabled: enabled }
  });
} else {
  // Create
  await prisma.userProfile.create({
    data: {
      user_id: user.id,
      email_notifications_enabled: enabled,
      first_name: null,
      last_name: null
    }
  });
}
```

### Partner Notifications API: `/api/partners/notifications`
**Method**: PUT
**Request Body**: `{ "emailNotificationsEnabled": true }`
**What it does**:
1. Authenticates user via Supabase token
2. Finds user in `users` table by `supabase_user_id`
3. Finds partner in `partners` table by `user_id`
4. Updates `partners.email_notifications_enabled`

**Current Implementation**:
```javascript
await prisma.partner.update({
  where: { id: partner.id },
  data: { email_notifications_enabled: enabled }
});
```

## What to Check

### 1. Database Column Existence
```sql
-- Check if columns exist
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles' 
  AND column_name = 'email_notifications_enabled';

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'partners' 
  AND column_name = 'email_notifications_enabled';
```

**Expected**: Both queries should return 1 row with:
- `data_type` = `boolean`
- `column_default` = `false`
- `is_nullable` = `NO`

### 2. Row Level Security (RLS) Policies
```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'partners');

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename IN ('user_profiles', 'partners');
```

**Questions**:
- Is RLS enabled on these tables?
- Are there policies that might block updates?
- Does the service role have access?

### 3. Foreign Key Constraints
```sql
-- Check foreign keys
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('user_profiles', 'partners');
```

**Expected**:
- `user_profiles.user_id` → `users.id`
- `partners.user_id` → `users.id`

### 4. Test Direct Database Update
```sql
-- Test updating user_profiles directly
UPDATE user_profiles 
SET email_notifications_enabled = true 
WHERE user_id = 'TEST_USER_ID'
RETURNING *;

-- Test updating partners directly
UPDATE partners 
SET email_notifications_enabled = true 
WHERE id = 'TEST_PARTNER_ID'
RETURNING *;
```

**Check**: Do these direct SQL updates work?

### 5. Check for Missing Migrations
```sql
-- Check if columns exist in actual database
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'email_notifications_enabled'
) AS user_profiles_has_column;

SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'partners' 
    AND column_name = 'email_notifications_enabled'
) AS partners_has_column;
```

### 6. Check Prisma Client Schema Match
- Does the Prisma schema match the actual database schema?
- Run `npx prisma db pull` to sync schema
- Run `npx prisma generate` to regenerate client

## Common Error Scenarios

### Scenario 1: Column Doesn't Exist
**Error**: `Unknown column 'email_notifications_enabled'`
**Fix**: Run migration to add column

### Scenario 2: RLS Blocking Updates
**Error**: `new row violates row-level security policy`
**Fix**: Add RLS policy or use service role

### Scenario 3: Foreign Key Violation
**Error**: `insert or update on table violates foreign key constraint`
**Fix**: Ensure `user_id` exists in `users` table

### Scenario 4: Unique Constraint Violation
**Error**: `duplicate key value violates unique constraint`
**Fix**: Check for duplicate `user_id` values

### Scenario 5: Type Mismatch
**Error**: `invalid input syntax for type boolean`
**Fix**: Ensure value is true/false, not string

## What We Need From You

1. **Check if columns exist** - Run the column existence queries above
2. **Check RLS policies** - Verify if RLS is blocking updates
3. **Check for migration issues** - See if schema is out of sync
4. **Test direct SQL updates** - Can we update these columns directly?
5. **Review error logs** - What's the actual database error?

## Error Logs to Look For

When the toggle fails, check for these log prefixes:
- `[USER_NOTIFICATIONS_API]` - User notification API errors
- `[PARTNERS_NOTIFICATIONS_API]` - Partner notification API errors
- `[USER_NOTIFICATIONS_API] Database error` - Database operation errors
- `[PARTNERS_NOTIFICATIONS_API] Update error` - Partner update errors

## Expected Behavior

When working correctly:
1. User toggles switch → Frontend sends PUT request
2. API authenticates user → Finds user/partner record
3. API updates database → Sets `email_notifications_enabled = true/false`
4. API returns success → Frontend updates UI

## Current Status

- ✅ Email service configured (SMTP working)
- ✅ API endpoints created
- ✅ Frontend toggles added
- ❌ Database update failing (500 error)
- ❓ Need to identify root cause

## Questions for Supabase Agent

1. Are the `email_notifications_enabled` columns present in both tables?
2. Are there any RLS policies blocking updates?
3. Can you test a direct SQL update to see if it works?
4. Are there any foreign key or constraint issues?
5. What's the actual error message from the database?

Please check these and provide:
- SQL queries to verify schema
- RLS policy recommendations
- Any missing migrations needed
- The actual database error message

