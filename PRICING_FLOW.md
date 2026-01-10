# Product Pricing Flow - Database as Single Source of Truth

## Overview

All product pricing now flows from the database as the single source of truth. The backend validates and uses database prices for all checkout and payment operations.

## Pricing Sources

### Database (Single Source of Truth)
- **Product base price**: Stored in `products.price` or `house_build_products.price`
- **Variant prices**: Stored in `products.metadata.variants[]` or `house_build_products.metadata.variants[]`
- All checkout/payment operations use prices from the database

### Frontend Display
- Frontend may display prices from product metadata for performance
- **Important**: Display prices are for UI only - actual charges always use database prices

## Flow Diagram

```
Database (products/house_build_products)
    ↓
ProductService.getVariantPrice() / product.price
    ↓
Backend Checkout APIs
    ↓
Stripe Payment Intent
    ↓
Order Creation (with validated price)
```

## Key Functions

### `ProductService.getVariantPrice(product, variantName)`
- Gets variant price from database metadata
- Validates variant exists
- Falls back to product base price if variant not found
- **Always returns database price, never trusts frontend**

### `ProductService.getValidatedPrice(productId, variantName)`
- Fetches product from database
- Gets variant price if variantName provided
- Returns product base price otherwise
- **Throws error if product not found**

## Updated Files

### Backend
1. **`lib/productService.js`**
   - Added `getVariantPrice()` - gets variant price from database
   - Added `getValidatedPrice()` - validates and gets price from database

2. **`pages/api/products/[id]/checkout.js`**
   - Now accepts `variantName` instead of `variantPrice`
   - Uses `ProductService.getVariantPrice()` to get price from database
   - Logs warnings if frontend sends different price

3. **`pages/api/products/checkout/guest.js`**
   - Uses `ProductService.getVariantPrice()` for variant prices
   - Always uses database prices

4. **`pages/api/products/checkout/cart.js`**
   - Uses `ProductService.getVariantPrice()` for variant prices
   - Logs warnings if frontend cart has different prices

### Frontend
1. **`pages/storecatalogue.js`**
   - Sends `variantName` instead of `variantPrice` to checkout API

2. **`components/store/SignatureCollections.js`**
   - Sends `variantName` instead of `variantPrice` to checkout API

## Price Validation

All checkout endpoints now:
1. Fetch product from database (checks both `products` and `house_build_products` tables)
2. If variantName provided, get variant price from database metadata
3. Use database price for payment calculation
4. Log warnings if frontend sent different price (for debugging)

## Cart Display vs Payment

- **Cart Display**: May show prices from frontend metadata (for performance)
- **Payment**: Always uses database prices (validated by backend)

This ensures:
- Fast UI rendering (no API calls needed for display)
- Accurate payments (always validated against database)
- Price consistency (database is single source of truth)

## Testing

To verify pricing is correct:
1. Check database prices match what's displayed
2. Complete a checkout and verify Stripe payment amount matches database price
3. Check server logs for price mismatch warnings
4. Verify order records show correct prices

## Migration Notes

After updating product prices in the database:
1. Prices are immediately used for new checkouts
2. Frontend display may cache old prices (refresh page)
3. Cart items may show old prices until checkout (backend validates)
