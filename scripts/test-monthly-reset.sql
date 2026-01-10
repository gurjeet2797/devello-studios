-- Test script to verify monthly reset functionality
-- Run this in your Supabase SQL editor

-- 1. Check if the column exists and has the right type
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'last_monthly_reset';

-- 2. Check if the index exists
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'user_profiles' 
AND indexname = 'idx_user_profiles_last_monthly_reset';

-- 3. Check current user profiles status
SELECT 
    COUNT(*) as total_profiles,
    COUNT(last_monthly_reset) as profiles_with_reset_date,
    COUNT(CASE WHEN last_monthly_reset > NOW() - INTERVAL '1 day' THEN 1 END) as recently_reset,
    AVG(upload_count) as avg_upload_count,
    MAX(upload_count) as max_upload_count
FROM user_profiles;

-- 4. Check one-time purchases status
SELECT 
    COUNT(*) as total_purchases,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_purchases,
    SUM(uploads_granted) as total_credits_granted,
    SUM(uploads_used) as total_credits_used,
    SUM(uploads_granted - uploads_used) as available_credits
FROM one_time_purchases;

-- 5. Test the monthly reset function (if it exists)
-- Uncomment the line below to test the function
-- SELECT perform_monthly_reset();

-- 6. Check if cron jobs are set up
SELECT 
    jobname, 
    schedule, 
    command, 
    active,
    last_run,
    next_run
FROM cron.job 
WHERE jobname LIKE '%monthly%reset%';

-- 7. Check cron job history (if any runs have occurred)
SELECT 
    jobname,
    start_time,
    end_time,
    status,
    return_message
FROM cron.job_run_details 
WHERE jobname LIKE '%monthly%reset%'
ORDER BY start_time DESC 
LIMIT 5;

-- 8. Sample of user profiles with their reset dates
SELECT 
    user_id,
    upload_count,
    upload_limit,
    last_monthly_reset,
    created_at,
    CASE 
        WHEN last_monthly_reset IS NULL THEN 'Never reset'
        WHEN last_monthly_reset > NOW() - INTERVAL '1 day' THEN 'Recently reset'
        WHEN EXTRACT(MONTH FROM last_monthly_reset) = EXTRACT(MONTH FROM NOW()) 
         AND EXTRACT(YEAR FROM last_monthly_reset) = EXTRACT(YEAR FROM NOW()) 
         THEN 'This month'
        ELSE 'Previous month'
    END as reset_status
FROM user_profiles 
ORDER BY last_monthly_reset DESC NULLS LAST
LIMIT 10;
