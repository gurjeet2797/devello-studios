-- Add order_type column to product_orders table
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) NOT NULL DEFAULT 'stock_product';

-- Create index on order_type
CREATE INDEX IF NOT EXISTS idx_product_orders_order_type ON product_orders(order_type);

-- Backfill existing orders based on their relationships
-- Check if custom_product_request_id column exists before using it
DO $$
BEGIN
    -- Check if custom_product_request_id column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'product_orders' 
        AND column_name = 'custom_product_request_id'
    ) THEN
        -- Orders with custom_product_request_id should be 'custom_order'
        UPDATE product_orders 
        SET order_type = 'custom_order' 
        WHERE custom_product_request_id IS NOT NULL;

        -- Orders with product_id but no custom_product_request_id should be 'stock_product'
        UPDATE product_orders 
        SET order_type = 'stock_product' 
        WHERE product_id IS NOT NULL AND custom_product_request_id IS NULL;
    ELSE
        -- If custom_product_request_id doesn't exist, all orders with product_id are stock products
        UPDATE product_orders 
        SET order_type = 'stock_product' 
        WHERE product_id IS NOT NULL;
    END IF;
END $$;

-- For any remaining orders (edge cases), default to 'stock_product'
UPDATE product_orders 
SET order_type = 'stock_product' 
WHERE order_type IS NULL OR order_type = '';

