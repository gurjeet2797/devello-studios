-- Align product_orders table with Prisma schema to stop webhook failures
-- Adds missing columns used by Stripe webhook handlers and creates indexes
-- Safe to rerun: uses IF NOT EXISTS guards

ALTER TABLE "product_orders"
  ADD COLUMN IF NOT EXISTS "preview_image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "shipping_address" JSONB,
  ADD COLUMN IF NOT EXISTS "order_items" JSONB,
  ADD COLUMN IF NOT EXISTS "admin_notes" TEXT,
  ADD COLUMN IF NOT EXISTS "customer_notes" TEXT,
  ADD COLUMN IF NOT EXISTS "tracking_number" TEXT,
  ADD COLUMN IF NOT EXISTS "carrier" TEXT,
  ADD COLUMN IF NOT EXISTS "estimated_ship_date" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "shipped_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMPTZ;

-- Helpful indexes for lookups and status filters
CREATE INDEX IF NOT EXISTS "idx_product_orders_order_number" ON "product_orders" ("order_number");
CREATE INDEX IF NOT EXISTS "idx_product_orders_status" ON "product_orders" ("status");
CREATE INDEX IF NOT EXISTS "idx_product_orders_payment_status" ON "product_orders" ("payment_status");
CREATE INDEX IF NOT EXISTS "idx_product_orders_order_type" ON "product_orders" ("order_type");
CREATE INDEX IF NOT EXISTS "idx_product_orders_guest_email" ON "product_orders" ("guest_email");
CREATE INDEX IF NOT EXISTS "idx_product_orders_tracking_number" ON "product_orders" ("tracking_number");
CREATE INDEX IF NOT EXISTS "idx_product_orders_estimated_ship_date" ON "product_orders" ("estimated_ship_date");
CREATE INDEX IF NOT EXISTS "idx_product_orders_shipped_at" ON "product_orders" ("shipped_at");
CREATE INDEX IF NOT EXISTS "idx_product_orders_delivered_at" ON "product_orders" ("delivered_at");
