# Supabase Migration: Email Notification Preferences

## Migration SQL

Run this SQL in your Supabase SQL Editor:

```sql
-- Add email notification preferences to user_profiles and partners tables

-- Add email_notifications_enabled to user_profiles
ALTER TABLE "user_profiles" 
ADD COLUMN IF NOT EXISTS "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT true;

-- Add email_notifications_enabled to partners
ALTER TABLE "partners" 
ADD COLUMN IF NOT EXISTS "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT true;
```

## Steps to Run in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click on **SQL Editor** in the left sidebar

2. **Create New Query**
   - Click **New Query**
   - Paste the SQL above

3. **Run the Migration**
   - Click **Run** (or press Ctrl+Enter)
   - You should see: "Success. No rows returned"

4. **Verify the Migration**
   - Run this query to verify:
   ```sql
   -- Check user_profiles column
   SELECT column_name, data_type, column_default, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'user_profiles' 
     AND column_name = 'email_notifications_enabled';

   -- Check partners column
   SELECT column_name, data_type, column_default, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'partners' 
     AND column_name = 'email_notifications_enabled';
   ```

   Expected result:
   - Both queries should return 1 row
   - `data_type` should be `boolean`
   - `column_default` should be `true`
   - `is_nullable` should be `NO`

## Alternative: Using Supabase CLI

If you prefer using the CLI:

```bash
# Connect to your database
supabase db connect

# Run the migration file
psql $DATABASE_URL -f prisma/migrations/manual_add_notification_preferences.sql
```

## Verification Checklist

After running the migration, verify:

- [ ] `user_profiles.email_notifications_enabled` column exists
- [ ] `partners.email_notifications_enabled` column exists
- [ ] Both columns are `BOOLEAN NOT NULL DEFAULT true`
- [ ] Existing rows have `true` as default value (or run migration to update)
- [ ] No errors in Supabase logs

## What This Migration Does

1. **Adds `email_notifications_enabled` to `user_profiles`**
   - Type: `BOOLEAN NOT NULL DEFAULT true`
   - Allows users to control email notifications
   - Default: enabled (true) - users can opt-out if desired

2. **Adds `email_notifications_enabled` to `partners`**
   - Type: `BOOLEAN NOT NULL DEFAULT true`
   - Allows partners to control email notifications
   - Default: enabled (true) - partners can opt-out if desired

## Notes

- The `IF NOT EXISTS` clause prevents errors if columns already exist
- All new rows will have `true` as the default value (notifications enabled by default)
- For existing databases, run the `change_notification_default_to_true.sql` migration to update the default
- Users/Partners can disable notifications via the UI (Profile/Partner Dashboard) if desired
- The notification system checks this flag before sending emails

## After Migration

Once the migration is complete:

1. ✅ Database columns are ready
2. ✅ UI toggles are already implemented
3. ✅ API endpoints are ready (`/api/user/notifications`, `/api/partners/notifications`)
4. ✅ Email service is ready (needs SMTP config in Vercel)
5. ✅ Notification helper checks these flags before sending

The system is fully ready once:
- Migration is run ✅ (this step)
- SMTP environment variables are set in Vercel
- Users/Partners enable notifications in their dashboards

