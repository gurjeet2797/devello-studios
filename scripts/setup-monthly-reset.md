# Monthly Reset Setup Guide

## Option 1: pg_cron (Recommended - Database Level)

### Step 1: Run the SQL Script
```sql
-- Copy and paste the contents of scripts/monthly-reset-cron.sql
-- into your Supabase SQL editor and run it
```

### Step 2: Verify the Job
```sql
-- Check if the cron job was created
SELECT * FROM cron.job WHERE jobname = 'monthly-upload-reset';

-- Check cron job history
SELECT * FROM cron.job_run_details 
WHERE jobname = 'monthly-upload-reset' 
ORDER BY start_time DESC 
LIMIT 5;
```

### Step 3: Test the Function
```sql
-- Test the reset function manually
SELECT perform_monthly_reset();

-- Check if it worked
SELECT COUNT(*) as profiles_reset 
FROM user_profiles 
WHERE last_monthly_reset > NOW() - INTERVAL '1 minute';
```

## Option 2: Edge Function (Application Level)

### Step 1: Deploy the Edge Function
```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy monthly-reset
```

### Step 2: Set up Scheduled Trigger
```sql
-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION trigger_monthly_reset()
RETURNS void AS $$
BEGIN
    -- Call the Edge Function
    PERFORM net.http_post(
        url := 'https://your-project-ref.supabase.co/functions/v1/monthly-reset',
        headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}',
        body := '{}'
    );
END;
$$ LANGUAGE plpgsql;

-- Schedule the function to run monthly
SELECT cron.schedule(
    'monthly-reset-edge-function',
    '0 2 1 * *', -- 2 AM UTC on the 1st of every month
    'SELECT trigger_monthly_reset();'
);
```

### Step 3: Test the Edge Function
```bash
# Test the function manually
curl -X POST "https://your-project-ref.supabase.co/functions/v1/monthly-reset" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Option 3: Hybrid Approach (Best of Both)

Use pg_cron for the database operations and Edge Function for logging/notifications:

```sql
-- Enhanced function with logging
CREATE OR REPLACE FUNCTION perform_monthly_reset_with_logging()
RETURNS void AS $$
DECLARE
    reset_count INTEGER := 0;
    purchase_reset_count INTEGER := 0;
    log_message TEXT;
BEGIN
    -- Perform the reset
    UPDATE user_profiles 
    SET 
        upload_count = 0,
        last_monthly_reset = NOW()
    WHERE 
        last_monthly_reset IS NULL 
        OR EXTRACT(MONTH FROM last_monthly_reset) != EXTRACT(MONTH FROM NOW())
        OR EXTRACT(YEAR FROM last_monthly_reset) != EXTRACT(YEAR FROM NOW());
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    
    UPDATE one_time_purchases 
    SET uploads_used = 0
    WHERE status = 'completed';
    
    GET DIAGNOSTICS purchase_reset_count = ROW_COUNT;
    
    -- Log to a table for tracking
    INSERT INTO monthly_reset_logs (
        reset_date, 
        profiles_reset, 
        purchases_reset, 
        status
    ) VALUES (
        NOW(), 
        reset_count, 
        purchase_reset_count, 
        'completed'
    );
    
    -- Optionally call Edge Function for notifications
    -- (uncomment if you want to send emails/notifications)
    -- PERFORM net.http_post(
    --     url := 'https://your-project-ref.supabase.co/functions/v1/notify-reset',
    --     headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}',
    --     body := json_build_object('profiles_reset', reset_count, 'purchases_reset', purchase_reset_count)
    -- );
    
    RAISE NOTICE 'Monthly reset completed: % profiles, % purchases', 
        reset_count, purchase_reset_count;
END;
$$ LANGUAGE plpgsql;

-- Create logging table
CREATE TABLE IF NOT EXISTS monthly_reset_logs (
    id SERIAL PRIMARY KEY,
    reset_date TIMESTAMPTZ NOT NULL,
    profiles_reset INTEGER NOT NULL,
    purchases_reset INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule the enhanced function
SELECT cron.schedule(
    'monthly-reset-enhanced',
    '0 2 1 * *',
    'SELECT perform_monthly_reset_with_logging();'
);
```

## Monitoring and Verification

### Check Reset Status
```sql
-- See when the last reset was performed
SELECT 
    reset_date,
    profiles_reset,
    purchases_reset,
    status
FROM monthly_reset_logs 
ORDER BY reset_date DESC 
LIMIT 5;

-- Check current user status
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN last_monthly_reset > NOW() - INTERVAL '1 day' THEN 1 END) as recently_reset,
    AVG(upload_count) as avg_upload_count
FROM user_profiles;
```

### Manual Reset (Emergency)
```sql
-- If you need to reset manually
SELECT perform_monthly_reset();

-- Or reset specific users
UPDATE user_profiles 
SET upload_count = 0, last_monthly_reset = NOW()
WHERE user_id IN ('user-id-1', 'user-id-2');
```

## Recommendations

1. **Use Option 1 (pg_cron)** for simplicity and reliability
2. **Add the logging table** to track reset history
3. **Set up monitoring** to alert if resets fail
4. **Test in staging** before production deployment
5. **Consider timezone handling** for global users

The pg_cron approach is recommended because:
- ✅ Runs at the database level (most reliable)
- ✅ No external dependencies
- ✅ Automatic retry on failure
- ✅ Built-in logging
- ✅ No additional costs
