-- Create custom_product_requests table
CREATE TABLE IF NOT EXISTS "custom_product_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "project_type" VARCHAR(100) NOT NULL,
    "project_description" TEXT,
    "product_description" TEXT,
    "project_stage" VARCHAR(50),
    "material" VARCHAR(100),
    "size" VARCHAR(100),
    "custom_size" TEXT,
    "height" VARCHAR(100),
    "width" VARCHAR(100),
    "delivery_method" VARCHAR(20),
    "shipping_address" JSONB,
    "uploaded_image" TEXT,
    "annotated_image" TEXT,
    "preview_image" TEXT,
    "space_rendered_image" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "additional_info" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'received',
    "quoted_price" INTEGER,
    "quoted_by" TEXT,
    "quoted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "custom_product_requests_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "custom_product_requests_user_id_idx" ON "custom_product_requests"("user_id");
CREATE INDEX IF NOT EXISTS "custom_product_requests_status_idx" ON "custom_product_requests"("status");
CREATE INDEX IF NOT EXISTS "custom_product_requests_created_at_idx" ON "custom_product_requests"("created_at");

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'custom_product_requests_user_id_fkey'
        AND table_name = 'custom_product_requests'
    ) THEN
        ALTER TABLE "custom_product_requests" 
        ADD CONSTRAINT "custom_product_requests_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Create quotes table
CREATE TABLE IF NOT EXISTS "quotes" (
    "id" TEXT NOT NULL,
    "custom_product_request_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "admin_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- Create indexes for quotes
CREATE INDEX IF NOT EXISTS "quotes_custom_product_request_id_idx" ON "quotes"("custom_product_request_id");
CREATE INDEX IF NOT EXISTS "quotes_status_idx" ON "quotes"("status");
CREATE INDEX IF NOT EXISTS "quotes_created_at_idx" ON "quotes"("created_at");

-- Add foreign key constraint for quotes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quotes_custom_product_request_id_fkey'
        AND table_name = 'quotes'
    ) THEN
        ALTER TABLE "quotes" 
        ADD CONSTRAINT "quotes_custom_product_request_id_fkey" 
        FOREIGN KEY ("custom_product_request_id") REFERENCES "custom_product_requests"("id") ON DELETE CASCADE;
    END IF;
END $$;

