-- Create leads table for lead generation form
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  company VARCHAR(255),
  project_type VARCHAR(50) NOT NULL,
  project_stage VARCHAR(50),
  primary_goal VARCHAR(50),
  role VARCHAR(50),
  description TEXT,
  target_platforms TEXT[],
  timeline VARCHAR(50),
  budget VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'new'
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to insert leads
CREATE POLICY "Allow service role to insert leads"
ON leads
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create policy for service role to read leads
CREATE POLICY "Allow service role to read leads"
ON leads
FOR SELECT
TO service_role
USING (true);
