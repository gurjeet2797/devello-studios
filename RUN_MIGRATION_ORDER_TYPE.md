# Run Migration for order_type Column

The `order_type` column has been added to the `product_orders` table schema. You need to run the migration to add this column to your database.

## Option 1: Run Prisma Migration (Recommended)

```bash
npx prisma migrate dev --name add_order_type_to_product_orders
```

This will:
1. Apply the migration from `prisma/migrations/20250121_add_order_type_to_product_orders/migration.sql`
2. Regenerate Prisma Client with the new schema

## Option 2: Run SQL Migration Manually

If you prefer to run the SQL directly in your Supabase SQL Editor or database client:

```sql
-- Add order_type column to product_orders table
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) NOT NULL DEFAULT 'stock_product';

-- Create index on order_type
CREATE INDEX IF NOT EXISTS idx_product_orders_order_type ON product_orders(order_type);

-- Backfill existing orders based on their relationships
-- Orders with custom_product_request_id should be 'custom_order'
UPDATE product_orders 
SET order_type = 'custom_order' 
WHERE custom_product_request_id IS NOT NULL;

-- Orders with product_id but no custom_product_request_id should be 'stock_product'
UPDATE product_orders 
SET order_type = 'stock_product' 
WHERE product_id IS NOT NULL AND custom_product_request_id IS NULL;

-- For any remaining orders (edge cases), default to 'stock_product'
UPDATE product_orders 
SET order_type = 'stock_product' 
WHERE order_type IS NULL OR order_type = '';
```

After running the migration, regenerate Prisma Client:

```bash
npx prisma generate
```

## Note

The code has been written to handle the case where the `order_type` column doesn't exist yet (backward compatibility), but for full functionality, the migration should be run.

