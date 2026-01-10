-- Verification query to check shipping profile assignments
-- Run this to see which products have which shipping profiles

SELECT 
  "shippingProfile",
  COUNT(*) as product_count,
  STRING_AGG("name", ', ' ORDER BY "name") as product_names
FROM "products"
WHERE "shippingProfile" IS NOT NULL
GROUP BY "shippingProfile"
ORDER BY "shippingProfile";

-- Show all products with their shipping profiles
SELECT 
  "name",
  "slug",
  "metadata"->>'category' as category,
  "metadata"->>'material' as material,
  "metadata"->>'type' as type,
  "shippingProfile"
FROM "products"
ORDER BY "shippingProfile" NULLS LAST, "name";

-- Check for products without shipping profiles (should be none if all products are categorized)
SELECT 
  "name",
  "slug",
  "metadata"->>'category' as category,
  "shippingProfile"
FROM "products"
WHERE "shippingProfile" IS NULL
  AND "status" = 'active';

