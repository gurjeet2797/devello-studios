-- Create Partners table
CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE,
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('construction', 'software_development', 'consulting')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  company_name VARCHAR(255) NOT NULL,
  experience_years INTEGER NOT NULL,
  description TEXT NOT NULL,
  portfolio_url VARCHAR(500),
  phone VARCHAR(50) NOT NULL,
  application_data JSONB,
  approved_at TIMESTAMP,
  approved_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_service_type ON partners(service_type);
CREATE INDEX IF NOT EXISTS idx_partners_created_at ON partners(created_at);

-- Add foreign key constraint to users table
ALTER TABLE partners 
ADD CONSTRAINT partners_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own partner record
CREATE POLICY "Users can view own partner record"
ON partners
FOR SELECT
TO authenticated
USING (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id = partners.user_id));

-- Policy: Users can insert their own partner application
CREATE POLICY "Users can insert own partner application"
ON partners
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id = partners.user_id));

-- Policy: Users can update their own partner record (for pending applications)
CREATE POLICY "Users can update own pending partner record"
ON partners
FOR UPDATE
TO authenticated
USING (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id = partners.user_id))
WITH CHECK (status = 'pending');

-- Policy: Service role (admin) can do everything
CREATE POLICY "Service role full access"
ON partners
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

