-- ============================================
-- RESTORE RLS POLICIES FOR AUTH FUNCTIONALITY
-- ============================================
-- Run this SQL in your Supabase SQL Editor to restore all RLS policies
-- This ensures authentication works properly across all tables

-- ============================================
-- USERS TABLE
-- ============================================
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view own user" ON users;

-- Policy: Users can view their own record
CREATE POLICY "Users can view own record"
ON users
FOR SELECT
TO authenticated
USING (auth.uid()::text = supabase_user_id);

-- Policy: Users can update their own record
CREATE POLICY "Users can update own record"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid()::text = supabase_user_id)
WITH CHECK (auth.uid()::text = supabase_user_id);

-- Policy: Service role can do everything (for Prisma/API routes)
CREATE POLICY "Service role can manage all users"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- USER_PROFILES TABLE
-- ============================================
-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON user_profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = user_profiles.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = user_profiles.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = user_profiles.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = user_profiles.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
);

-- Policy: Service role can do everything (for Prisma/API routes)
CREATE POLICY "Service role can manage all profiles"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
-- Enable RLS on subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON subscriptions;

-- Policy: Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON subscriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = subscriptions.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
);

-- Policy: Users can update their own subscription
CREATE POLICY "Users can update own subscription"
ON subscriptions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = subscriptions.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = subscriptions.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
);

-- Policy: Service role can do everything (for Prisma/API routes)
CREATE POLICY "Service role can manage all subscriptions"
ON subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- UPLOADS TABLE
-- ============================================
-- Enable RLS on uploads table
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own uploads" ON uploads;
DROP POLICY IF EXISTS "Users can insert own uploads" ON uploads;
DROP POLICY IF EXISTS "Users can update own uploads" ON uploads;
DROP POLICY IF EXISTS "Service role can manage all uploads" ON uploads;

-- Policy: Users can view their own uploads
CREATE POLICY "Users can view own uploads"
ON uploads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = uploads.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
);

-- Policy: Users can insert their own uploads
CREATE POLICY "Users can insert own uploads"
ON uploads
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = uploads.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
);

-- Policy: Users can update their own uploads
CREATE POLICY "Users can update own uploads"
ON uploads
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = uploads.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = uploads.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
);

-- Policy: Service role can do everything (for Prisma/API routes)
CREATE POLICY "Service role can manage all uploads"
ON uploads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- ONE_TIME_PURCHASES TABLE
-- ============================================
-- Enable RLS on one_time_purchases table
ALTER TABLE one_time_purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own purchases" ON one_time_purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON one_time_purchases;
DROP POLICY IF EXISTS "Service role can manage all purchases" ON one_time_purchases;

-- Policy: Users can view their own purchases
CREATE POLICY "Users can view own purchases"
ON one_time_purchases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = one_time_purchases.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
);

-- Policy: Users can insert their own purchases
CREATE POLICY "Users can insert own purchases"
ON one_time_purchases
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = one_time_purchases.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
);

-- Policy: Service role can do everything (for Prisma/API routes)
CREATE POLICY "Service role can manage all purchases"
ON one_time_purchases
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- STRIPE_TRANSACTIONS TABLE
-- ============================================
-- Enable RLS on stripe_transactions table
ALTER TABLE stripe_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own transactions" ON stripe_transactions;
DROP POLICY IF EXISTS "Service role can manage all transactions" ON stripe_transactions;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON stripe_transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = stripe_transactions.user_id 
    AND users.supabase_user_id = auth.uid()::text
  )
);

-- Policy: Service role can do everything (for Prisma/API routes)
CREATE POLICY "Service role can manage all transactions"
ON stripe_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- PARTNERS TABLE (if it exists)
-- ============================================
-- Only run if partners table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners') THEN
    -- Enable RLS on partners table
    ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own partner record" ON partners;
    DROP POLICY IF EXISTS "Users can insert own partner application" ON partners;
    DROP POLICY IF EXISTS "Users can update own pending partner record" ON partners;
    DROP POLICY IF EXISTS "Service role full access" ON partners;
    DROP POLICY IF EXISTS "Admin can view all partners" ON partners;
    DROP POLICY IF EXISTS "Admin can update all partners" ON partners;
    
    -- Policy: Users can view their own partner record
    CREATE POLICY "Users can view own partner record"
    ON partners
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = partners.user_id 
        AND users.supabase_user_id = auth.uid()::text
      )
    );
    
    -- Policy: Users can insert their own partner application
    CREATE POLICY "Users can insert own partner application"
    ON partners
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = partners.user_id 
        AND users.supabase_user_id = auth.uid()::text
      )
    );
    
    -- Policy: Users can update their own partner record (only if pending)
    CREATE POLICY "Users can update own pending partner record"
    ON partners
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = partners.user_id 
        AND users.supabase_user_id = auth.uid()::text
      )
      AND status = 'pending'
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = partners.user_id 
        AND users.supabase_user_id = auth.uid()::text
      )
      AND status = 'pending'
    );
    
    -- Policy: Admin (sales@devello.us) can view all partners
    CREATE POLICY "Admin can view all partners"
    ON partners
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.supabase_user_id = auth.uid()::text
        AND users.email = 'sales@devello.us'
      )
    );
    
    -- Policy: Admin (sales@devello.us) can update all partners
    CREATE POLICY "Admin can update all partners"
    ON partners
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.supabase_user_id = auth.uid()::text
        AND users.email = 'sales@devello.us'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.supabase_user_id = auth.uid()::text
        AND users.email = 'sales@devello.us'
      )
    );
    
    -- Policy: Service role can do everything (for Prisma/API routes)
    CREATE POLICY "Service role full access"
    ON partners
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- VERIFY RLS STATUS
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'user_profiles', 'subscriptions', 'uploads', 'one_time_purchases', 'stripe_transactions', 'partners')
ORDER BY tablename;

-- ============================================
-- VERIFY POLICIES EXIST
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'user_profiles', 'subscriptions', 'uploads', 'one_time_purchases', 'stripe_transactions', 'partners')
ORDER BY tablename, policyname;

-- ============================================
-- IMPORTANT NOTES
-- ============================================
-- 1. These RLS policies allow authenticated users to access their own data
-- 2. Service role policies allow Prisma/API routes (using service role key) to access all data
-- 3. If you're using Prisma with DATABASE_URL (service role), RLS is bypassed automatically
-- 4. The main issue was likely using service role key for getUser() - now fixed to use anon key
-- 5. After running this, try signing in again and clearing browser cache

