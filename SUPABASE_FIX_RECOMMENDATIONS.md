# Supabase Fix Recommendations for Email Notifications

## If Columns Don't Exist

Run this migration:

```sql
-- Add email_notifications_enabled to user_profiles if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'email_notifications_enabled'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN email_notifications_enabled BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add email_notifications_enabled to partners if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'partners' 
      AND column_name = 'email_notifications_enabled'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN email_notifications_enabled BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;
```

## If RLS is Blocking Updates

### Option 1: Allow Service Role (Recommended for API)
```sql
-- Allow service role to update user_profiles
CREATE POLICY IF NOT EXISTS "service_role_can_update_user_profiles"
ON user_profiles
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Allow service role to update partners
CREATE POLICY IF NOT EXISTS "service_role_can_update_partners"
ON partners
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
```

### Option 2: Allow Authenticated Users to Update Their Own Records
```sql
-- Users can update their own profile
CREATE POLICY IF NOT EXISTS "users_update_own_profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Partners can update their own partner record
CREATE POLICY IF NOT EXISTS "partners_update_own_record"
ON partners
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = partners.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = partners.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
);
```

## If Foreign Key Issues

Check that user_id values match:
```sql
-- Find orphaned user_profiles
SELECT up.* 
FROM user_profiles up
LEFT JOIN users u ON up.user_id = u.id
WHERE u.id IS NULL;

-- Find orphaned partners
SELECT p.* 
FROM partners p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;
```

## Test Update Query

After fixing, test with:
```sql
-- Test user_profiles update (replace with actual user_id)
UPDATE user_profiles 
SET email_notifications_enabled = true 
WHERE user_id = (SELECT id FROM users LIMIT 1)
RETURNING user_id, email_notifications_enabled;

-- Test partners update (replace with actual partner id)
UPDATE partners 
SET email_notifications_enabled = true 
WHERE id = (SELECT id FROM partners LIMIT 1)
RETURNING id, email_notifications_enabled;
```

