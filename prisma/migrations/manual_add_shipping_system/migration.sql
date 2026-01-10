-- Create ShippingProfileCode enum
CREATE TYPE "ShippingProfileCode" AS ENUM ('INTERIOR_WOOD_DOOR', 'METAL_GLASS_DOOR', 'WINDOW_STANDARD', 'GLASS_PANEL_MIRROR');

-- Create DeliveryAccess enum
CREATE TYPE "DeliveryAccess" AS ENUM ('RESIDENTIAL', 'COMMERCIAL_DOCK', 'COMMERCIAL_NO_DOCK', 'CONSTRUCTION_SITE');

-- Create DeliveryType enum
CREATE TYPE "DeliveryType" AS ENUM ('CURBSIDE', 'WHITE_GLOVE');

-- Add shippingProfile column to products table (nullable)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shippingProfile" "ShippingProfileCode";

-- Create shipping_requests table
CREATE TABLE IF NOT EXISTS "shipping_requests" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT,
    "orderId" TEXT,
    "email" TEXT,
    "zip" VARCHAR(10) NOT NULL,
    "deliveryAccess" "DeliveryAccess" NOT NULL,
    "liftgate" BOOLEAN NOT NULL DEFAULT false,
    "appointment" BOOLEAN NOT NULL DEFAULT false,
    "deliveryType" "DeliveryType" NOT NULL DEFAULT 'CURBSIDE',
    "notes" TEXT,
    "estimateLow" INTEGER,
    "estimateHigh" INTEGER,
    "cratingFee" INTEGER,
    "whiteGloveFee" INTEGER,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW',

    CONSTRAINT "shipping_requests_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "shipping_requests_productId_idx" ON "shipping_requests"("productId");
CREATE INDEX IF NOT EXISTS "shipping_requests_orderId_idx" ON "shipping_requests"("orderId");
CREATE INDEX IF NOT EXISTS "shipping_requests_status_idx" ON "shipping_requests"("status");
CREATE INDEX IF NOT EXISTS "shipping_requests_createdAt_idx" ON "shipping_requests"("createdAt");

-- Add foreign key constraint
ALTER TABLE "shipping_requests" ADD CONSTRAINT "shipping_requests_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

