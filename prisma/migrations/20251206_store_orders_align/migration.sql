-- Align product_orders/payment schema for store orders + Stripe mapping
-- Adds missing custom_product_request_id, intent indexes, and supporting FKs.

-- Ensure columns exist
ALTER TABLE "product_orders"
  ADD COLUMN IF NOT EXISTS "custom_product_request_id" TEXT,
  ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" TEXT;

-- Unique + FK for custom_product_request_id (nullable, set null on delete)
DO $$
BEGIN
  ALTER TABLE "product_orders"
    ADD CONSTRAINT "product_orders_custom_product_request_id_key"
    UNIQUE ("custom_product_request_id");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "product_orders"
    ADD CONSTRAINT "product_orders_custom_product_request_id_fkey"
    FOREIGN KEY ("custom_product_request_id") REFERENCES "custom_product_requests"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS "idx_product_orders_user_id" ON "product_orders" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_product_orders_guest_email" ON "product_orders" ("guest_email");
CREATE INDEX IF NOT EXISTS "idx_product_orders_intent" ON "product_orders" ("stripe_payment_intent_id");
CREATE INDEX IF NOT EXISTS "idx_payments_intent" ON "payments" ("stripe_payment_intent_id");
