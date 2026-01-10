-- Update upload limits to include free tier bonus
-- Basic plan: 40 + 10 free = 50 total
-- Pro plan: 60 + 10 free = 70 total

-- Update existing subscriptions with basic plan (40 + 10 = 50)
UPDATE subscriptions 
SET upload_limit = 50 
WHERE plan_type = 'basic';

-- Update existing subscriptions with pro plan (60 + 10 = 70)
UPDATE subscriptions 
SET upload_limit = 70 
WHERE plan_type = 'pro';

-- Update user profiles for users with basic subscriptions
UPDATE user_profiles 
SET upload_limit = 50 
WHERE user_id IN (
  SELECT user_id 
  FROM subscriptions 
  WHERE plan_type = 'basic'
);

-- Update user profiles for users with pro subscriptions
UPDATE user_profiles 
SET upload_limit = 70 
WHERE user_id IN (
  SELECT user_id 
  FROM subscriptions 
  WHERE plan_type = 'pro'
);

-- Add comments to clarify the updated limits
COMMENT ON COLUMN subscriptions.upload_limit IS 'Upload limit: Free=10, Basic=50 (40+10), Pro=70 (60+10)';
COMMENT ON COLUMN user_profiles.upload_limit IS 'Upload limit: Free=10, Basic=50 (40+10), Pro=70 (60+10)';
