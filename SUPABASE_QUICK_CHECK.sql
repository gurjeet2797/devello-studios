-- Quick Supabase Database Check for Email Notifications
-- Run these queries in Supabase SQL Editor

-- 1. Check if user_profiles.email_notifications_enabled exists
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable,
  table_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles' 
  AND column_name = 'email_notifications_enabled';

-- 2. Check if partners.email_notifications_enabled exists
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable,
  table_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'partners' 
  AND column_name = 'email_notifications_enabled';

-- 3. Check RLS status
SELECT 
  schemaname,
  tablename, 
  rowsecurity,
  CASE WHEN rowsecurity THEN 'RLS Enabled' ELSE 'RLS Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'partners');

-- 4. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'partners');

-- 5. Check foreign key constraints
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('user_profiles', 'partners');

-- 6. Test: Count records with notifications enabled
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN email_notifications_enabled = true THEN 1 END) as enabled_count,
  COUNT(CASE WHEN email_notifications_enabled = false THEN 1 END) as disabled_count
FROM user_profiles
UNION ALL
SELECT 
  'partners' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN email_notifications_enabled = true THEN 1 END) as enabled_count,
  COUNT(CASE WHEN email_notifications_enabled = false THEN 1 END) as disabled_count
FROM partners;

-- 7. Check if there are any NOT NULL constraints that might be missing
SELECT 
  table_name,
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'partners')
  AND column_name = 'email_notifications_enabled';

