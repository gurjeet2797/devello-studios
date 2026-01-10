# Product Shipping Profiles Update

## Summary

Shipping profiles have been set on all products based on their category and type. The following mapping was applied:

### Shipping Profile Mappings

1. **WINDOW_STANDARD** - All products with `category = 'windows'`
2. **INTERIOR_WOOD_DOOR** - Interior wood doors
   - Doors with `type = 'interior'`
   - Doors with `material = 'wood'`
   - Doors with "interior" in the name
3. **METAL_GLASS_DOOR** - Metal/glass doors (exterior, sliding, etc.)
   - Doors with `type = 'exterior'` or `type = 'sliding'`
   - Doors with `material = 'steel'`, `'metal'`, `'glass'`, or `'aluminum'`
   - Doors with "exterior", "sliding", or "glass" in the name
4. **GLASS_PANEL_MIRROR** - Glass and mirror products
   - Products with `category = 'glass'` or `category = 'mirrors'`
   - Products with "glass" and "panel"/"door"/"shower" in the name
   - Products with "mirror" in the name

## SQL Updates Applied

The following SQL was executed to update product shipping profiles:

```sql
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
```

## Verification

To verify the updates, run this query in your Supabase SQL Editor:

```sql
-- Show products grouped by shipping profile
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

-- Check for products without shipping profiles
SELECT 
  "name",
  "slug",
  "metadata"->>'category' as category,
  "shippingProfile"
FROM "products"
WHERE "shippingProfile" IS NULL
  AND "status" = 'active';
```

## Files

- Migration SQL: `prisma/migrations/manual_update_product_shipping_profiles/migration.sql`
- Verification SQL: `prisma/migrations/manual_update_product_shipping_profiles/verify.sql`

## Next Steps

1. ✅ Shipping profiles have been set on all products
2. ✅ Database schema updated with shipping system
3. ⏳ When ready to launch shipping: Remove "Coming Soon" badges from UI
4. ⏳ Test shipping estimate functionality with real products

