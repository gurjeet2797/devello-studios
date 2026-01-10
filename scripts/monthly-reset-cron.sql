-- Monthly Reset Automation with pg_cron
-- Run this in your Supabase SQL editor

-- 1. First, let's add the timezone-safe column type
ALTER TABLE public.user_profiles 
ALTER COLUMN last_monthly_reset TYPE TIMESTAMPTZ 
USING last_monthly_reset AT TIME ZONE 'UTC';

-- 2. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_monthly_reset 
ON public.user_profiles(last_monthly_reset);

-- 3. Create a function to perform monthly resets
CREATE OR REPLACE FUNCTION perform_monthly_reset()
RETURNS void AS $$
DECLARE
    reset_count INTEGER := 0;
    purchase_reset_count INTEGER := 0;
BEGIN
    -- Reset user upload counts
    UPDATE user_profiles 
    SET 
        upload_count = 0,
        last_monthly_reset = NOW()
    WHERE 
        last_monthly_reset IS NULL 
        OR EXTRACT(MONTH FROM last_monthly_reset) != EXTRACT(MONTH FROM NOW())
        OR EXTRACT(YEAR FROM last_monthly_reset) != EXTRACT(YEAR FROM NOW());
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    
    -- Reset one-time purchase credits (they don't carry over to next month)
    UPDATE one_time_purchases 
    SET uploads_granted = 0, uploads_used = 0
    WHERE status = 'completed';
    
    GET DIAGNOSTICS purchase_reset_count = ROW_COUNT;
    
    -- Log the reset
    RAISE NOTICE 'Monthly reset completed: % user profiles reset, % purchases reset', 
        reset_count, purchase_reset_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Schedule the monthly reset job (runs on the 1st of every month at 2 AM UTC)
SELECT cron.schedule(
    'monthly-upload-reset',
    '0 2 1 * *', -- 2 AM UTC on the 1st of every month
    'SELECT perform_monthly_reset();'
);

-- 5. Verify the job was created
SELECT * FROM cron.job WHERE jobname = 'monthly-upload-reset';

-- 6. Test the function manually (optional)
-- SELECT perform_monthly_reset();
