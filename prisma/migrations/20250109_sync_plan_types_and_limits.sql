-- Migration: Sync plan types and upload limits with code
-- Date: 2025-01-09
-- Purpose: Align database schema with hardcoded limits in code

-- Update subscription plan_type enum to match code
ALTER TABLE subscriptions 
ALTER COLUMN plan_type TYPE VARCHAR(20);

-- Update upload limits in user_profiles table
UPDATE user_profiles 
SET upload_limit = 10 
WHERE upload_limit = 10; -- Free tier (already correct)

-- Update subscription upload limits based on plan type
UPDATE subscriptions 
SET upload_limit = CASE 
  WHEN plan_type = 'free' THEN 10
  WHEN plan_type = 'basic' THEN 30  
  WHEN plan_type = 'pro' THEN 60
  ELSE 10
END;

-- Add comment to clarify the limits
COMMENT ON COLUMN user_profiles.upload_limit IS 'Upload limit: Free=10, Basic=30, Pro=60';
COMMENT ON COLUMN subscriptions.upload_limit IS 'Upload limit: Free=10, Basic=30, Pro=60';
COMMENT ON COLUMN subscriptions.plan_type IS 'Plan types: free, basic, pro';
