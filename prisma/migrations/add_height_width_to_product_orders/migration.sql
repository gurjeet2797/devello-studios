-- Add height and width columns to product_orders table
ALTER TABLE "product_orders" 
ADD COLUMN IF NOT EXISTS "height" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "width" VARCHAR(50);

