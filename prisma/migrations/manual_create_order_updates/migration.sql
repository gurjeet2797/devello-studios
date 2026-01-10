-- Create order_updates table for tracking order history
CREATE TABLE IF NOT EXISTS "order_updates" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "product_order_id" TEXT NOT NULL,
  "update_type" VARCHAR(20) NOT NULL,
  "message" TEXT,
  "updated_by" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "order_updates_product_order_id_fkey" FOREIGN KEY ("product_order_id") REFERENCES "product_orders"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_order_updates_product_order_id" ON "order_updates"("product_order_id");
CREATE INDEX IF NOT EXISTS "idx_order_updates_update_type" ON "order_updates"("update_type");
CREATE INDEX IF NOT EXISTS "idx_order_updates_created_at" ON "order_updates"("created_at");
