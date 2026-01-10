-- Update upload limits for Basic plan from 30 to 40
-- Update existing subscriptions with basic plan
UPDATE subscriptions 
SET upload_limit = 40 
WHERE plan_type = 'basic';

-- Update user profiles for users with basic subscriptions
UPDATE user_profiles 
SET upload_limit = 40 
WHERE user_id IN (
  SELECT user_id 
  FROM subscriptions 
  WHERE plan_type = 'basic'
);

-- Add comment to clarify the updated limits
COMMENT ON COLUMN subscriptions.upload_limit IS 'Upload limit: Free=10, Basic=40, Pro=60';
COMMENT ON COLUMN user_profiles.upload_limit IS 'Upload limit: Free=10, Basic=40, Pro=60';
