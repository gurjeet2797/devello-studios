-- Verify order_updates table was created successfully
-- Run this in Supabase SQL Editor after running the migration

-- Check if table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'order_updates'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'order_updates';

-- Test insert (optional - will create a test record)
-- INSERT INTO order_updates (id, product_order_id, update_type, message, updated_by)
-- VALUES ('test_' || gen_random_uuid()::text, 
--         (SELECT id FROM product_orders LIMIT 1),
--         'status',
--         'Test update',
--         'admin')
-- RETURNING *;
