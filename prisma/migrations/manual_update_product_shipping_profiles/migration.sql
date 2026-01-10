-- Update shipping profiles for existing products based on their category and type
-- This migration sets the shippingProfile field based on product metadata

-- 1. Set WINDOW_STANDARD for all windows
UPDATE "products"
SET "shippingProfile" = 'WINDOW_STANDARD'
WHERE "metadata"->>'category' = 'windows'
  AND "shippingProfile" IS NULL;

-- 2. Set INTERIOR_WOOD_DOOR for interior wood doors
UPDATE "products"
SET "shippingProfile" = 'INTERIOR_WOOD_DOOR'
WHERE "metadata"->>'category' = 'doors'
  AND (
    ("metadata"->>'type' = 'interior') OR
    ("metadata"->>'material' = 'wood') OR
    (LOWER("name") LIKE '%interior%' AND LOWER("name") LIKE '%door%')
  )
  AND "shippingProfile" IS NULL;

-- 3. Set METAL_GLASS_DOOR for metal/glass doors (exterior, sliding, etc.)
UPDATE "products"
SET "shippingProfile" = 'METAL_GLASS_DOOR'
WHERE "metadata"->>'category' = 'doors'
  AND (
    ("metadata"->>'type' IN ('exterior', 'sliding')) OR
    ("metadata"->>'material' IN ('steel', 'metal', 'glass', 'aluminum')) OR
    (LOWER("name") LIKE '%exterior%' AND LOWER("name") LIKE '%door%') OR
    (LOWER("name") LIKE '%sliding%' AND LOWER("name") LIKE '%door%') OR
    (LOWER("name") LIKE '%glass%' AND LOWER("name") LIKE '%door%')
  )
  AND "shippingProfile" IS NULL;

-- 4. Set GLASS_PANEL_MIRROR for glass and mirror products
UPDATE "products"
SET "shippingProfile" = 'GLASS_PANEL_MIRROR'
WHERE (
    ("metadata"->>'category' = 'glass') OR
    ("metadata"->>'category' = 'mirrors') OR
    (LOWER("name") LIKE '%glass%' AND (LOWER("name") LIKE '%panel%' OR LOWER("name") LIKE '%door%' OR LOWER("name") LIKE '%shower%')) OR
    (LOWER("name") LIKE '%mirror%')
  )
  AND "shippingProfile" IS NULL;

-- 5. Set INTERIOR_WOOD_DOOR for any remaining doors (default to interior wood)
UPDATE "products"
SET "shippingProfile" = 'INTERIOR_WOOD_DOOR'
WHERE "metadata"->>'category' = 'doors'
  AND "shippingProfile" IS NULL;

-- Verify the updates
SELECT 
  "name",
  "metadata"->>'category' as category,
  "metadata"->>'material' as material,
  "metadata"->>'type' as type,
  "shippingProfile"
FROM "products"
WHERE "shippingProfile" IS NOT NULL
ORDER BY "shippingProfile", "name";

