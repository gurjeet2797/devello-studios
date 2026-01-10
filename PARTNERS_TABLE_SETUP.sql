-- Create Partners table in Supabase
-- Optimized version with UUID primary key, improved RLS policies, and security best practices
-- Run this SQL in your Supabase SQL Editor

-- Confirm users table structure matches:
--   id (TEXT) - primary key (cuid)
--   supabase_user_id (TEXT) - matches auth.uid()
--   email (TEXT) - for admin checks

-- Create Partners table with UUID primary key for better performance
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('construction', 'software_development', 'consulting')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  company_name VARCHAR(255) NOT NULL,
  experience_years INTEGER NOT NULL,
  description TEXT NOT NULL,
  portfolio_url VARCHAR(500),
  phone VARCHAR(50) NOT NULL,
  application_data JSONB,
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_service_type ON partners(service_type);
CREATE INDEX IF NOT EXISTS idx_partners_created_at ON partners(created_at);

-- Add foreign key constraint to users table (only if constraint doesn't exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'partners_user_id_fkey'
    ) THEN
      ALTER TABLE partners 
      ADD CONSTRAINT partners_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Users can view own partner record" ON partners;
DROP POLICY IF EXISTS "Users can insert own partner application" ON partners;
DROP POLICY IF EXISTS "Users can update own pending partner record" ON partners;
DROP POLICY IF EXISTS "Service role full access" ON partners;
DROP POLICY IF EXISTS "Admin can view all partners" ON partners;
DROP POLICY IF EXISTS "Admin can update all partners" ON partners;

-- Policy: Users can view their own partner record
-- Using SELECT auth.uid() pattern for better plan caching
CREATE POLICY "Users can view own partner record"
ON partners
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = partners.user_id 
    AND users.supabase_user_id = (SELECT auth.uid()::text)
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
    AND users.supabase_user_id = (SELECT auth.uid()::text)
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
    AND users.supabase_user_id = (SELECT auth.uid()::text)
  )
  AND status = 'pending'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = partners.user_id 
    AND users.supabase_user_id = (SELECT auth.uid()::text)
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
    WHERE users.supabase_user_id = (SELECT auth.uid()::text)
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
    WHERE users.supabase_user_id = (SELECT auth.uid()::text)
    AND users.email = 'sales@devello.us'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.supabase_user_id = (SELECT auth.uid()::text)
    AND users.email = 'sales@devello.us'
  )
);

-- Policy: Service role (for API routes) can do everything
CREATE POLICY "Service role full access"
ON partners
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create a trigger function to automatically update updated_at timestamp
-- Pin search_path for security and mark as STABLE
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = (now() AT TIME ZONE 'utc');
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS partners_updated_at ON partners;
CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partners_updated_at();

-- Verify table creation
SELECT 
  'Partners table created successfully!' as status,
  COUNT(*) as total_partners
FROM partners;
