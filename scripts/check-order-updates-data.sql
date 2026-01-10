-- Diagnostic query to check for orderUpdates issues
-- This will help identify if orderUpdates are incorrectly tied to products

-- Check for orderUpdates that might be shared across orders
SELECT 
    ou.id,
    ou.product_order_id,
    ou.message,
    ou.updated_by,
    ou.created_at,
    po.id as order_id,
    po.order_number,
    po.user_id,
    po.product_id,
    p.name as product_name
FROM order_updates ou
JOIN product_orders po ON ou.product_order_id = po.id
LEFT JOIN products p ON po.product_id = p.id
WHERE p.name LIKE '%Dummy%' OR p.name LIKE '%dummy%'
ORDER BY ou.created_at DESC
LIMIT 50;

-- Check if multiple orders share the same orderUpdates (shouldn't happen)
SELECT 
    product_order_id,
    COUNT(*) as update_count,
    STRING_AGG(DISTINCT message, ' | ') as messages
FROM order_updates
GROUP BY product_order_id
HAVING COUNT(*) > 10
ORDER BY update_count DESC;

-- Check for orders with the same product that have the same messages
SELECT 
    po1.id as order1_id,
    po1.order_number as order1_number,
    po1.user_id as order1_user,
    po2.id as order2_id,
    po2.order_number as order2_number,
    po2.user_id as order2_user,
    ou1.message,
    ou1.created_at
FROM product_orders po1
JOIN product_orders po2 ON po1.product_id = po2.product_id AND po1.id != po2.id
JOIN order_updates ou1 ON ou1.product_order_id = po1.id
JOIN order_updates ou2 ON ou2.product_order_id = po2.id
WHERE ou1.message = ou2.message
  AND ou1.created_at = ou2.created_at
  AND (po1.product_id IN (SELECT id FROM products WHERE name LIKE '%Dummy%'))
LIMIT 20;
