-- Create house_build_products table to separate Build a House products from windows/doors/glass/mirrors
-- This migration creates the new table and moves all non-window/door/glass/mirror products

-- Step 1: Create the house_build_products table with same structure as products
CREATE TABLE IF NOT EXISTS "house_build_products" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "slug" TEXT NOT NULL UNIQUE,
  "price" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
  "stripe_price_id" TEXT,
  "product_type" VARCHAR(20) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "image_url" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- Step 2: Create indexes for house_build_products
CREATE INDEX IF NOT EXISTS "idx_house_build_products_slug" ON "house_build_products" ("slug");
CREATE INDEX IF NOT EXISTS "idx_house_build_products_status" ON "house_build_products" ("status");
CREATE INDEX IF NOT EXISTS "idx_house_build_products_product_type" ON "house_build_products" ("product_type");

-- Step 3: Move products that are NOT windows, doors, glass, or mirrors to house_build_products
-- Keep windows, doors, glass, and mirrors in the products table
INSERT INTO "house_build_products" (
  "id", "name", "description", "slug", "price", "currency", "stripe_price_id", 
  "product_type", "status", "image_url", "metadata", "created_at", "updated_at"
)
SELECT 
  "id", "name", "description", "slug", "price", "currency", "stripe_price_id",
  "product_type", "status", "image_url", "metadata", "created_at", "updated_at"
FROM "products"
WHERE 
  -- Exclude windows, doors, glass, and mirrors
  NOT (
    ("metadata"->>'category' = 'windows') OR
    ("metadata"->>'category' = 'doors') OR
    ("metadata"->>'category' = 'glass') OR
    ("metadata"->>'category' = 'mirrors')
  );

-- Step 4: Update foreign key constraint to SET NULL instead of CASCADE
-- This prevents orders from being deleted when products are moved
ALTER TABLE "product_orders"
  DROP CONSTRAINT IF EXISTS "product_orders_product_id_fkey";

ALTER TABLE "product_orders"
  ADD CONSTRAINT "product_orders_product_id_fkey" 
  FOREIGN KEY ("product_id") 
  REFERENCES "products"("id") 
  ON DELETE SET NULL;

-- Step 5: Delete the moved products from products table
-- Only delete products that are NOT referenced by existing orders
-- Products with existing orders will remain in products table to preserve foreign key references
DELETE FROM "products"
WHERE 
  NOT (
    ("metadata"->>'category' = 'windows') OR
    ("metadata"->>'category' = 'doors') OR
    ("metadata"->>'category' = 'glass') OR
    ("metadata"->>'category' = 'mirrors')
  )
  AND "id" NOT IN (
    SELECT DISTINCT "product_id" 
    FROM "product_orders" 
    WHERE "product_id" IS NOT NULL
  );

-- Step 6: Update pricing for specific products
-- Casement window: $1800 (180000 cents)
UPDATE "products"
SET "price" = 180000, "updated_at" = NOW()
WHERE "slug" = 'casement-window';

-- Single Hung paneled glass window: $800 (80000 cents)
UPDATE "products"
SET "price" = 80000, "updated_at" = NOW()
WHERE "slug" = 'single-hung-paneled-glass-window';

-- French Door Glass panel: $2800 (280000 cents)
UPDATE "products"
SET "price" = 280000, "updated_at" = NOW()
WHERE "slug" = 'french-door-paneled-glass-window';

-- Double Hung Window: $680 (68000 cents)
UPDATE "products"
SET "price" = 68000, "updated_at" = NOW()
WHERE "slug" = 'double-hung-window';

-- Sliding Window: $1200 (120000 cents)
UPDATE "products"
SET "price" = 120000, "updated_at" = NOW()
WHERE "slug" = 'sliding-window';

-- Single Hung Window: $420 (42000 cents)
UPDATE "products"
SET "price" = 42000, "updated_at" = NOW()
WHERE "slug" = 'single-hung-window';
