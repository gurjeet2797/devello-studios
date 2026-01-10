# Dummy Product Testing Guide

This guide explains how to test the dummy product ($1.00) checkout flow for both authenticated and guest users.

## Setup Steps

### 1. Create Dummy Product in Database

Run the script to create the dummy product:

```bash
node scripts/create-dummy-product.js
```

This creates a product with:
- Name: "Dummy window"
- Slug: "dummy-window"
- Price: $1.00 (100 cents)
- Category: windows
- Status: active

### 2. Create Product in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) (Test mode)
2. Navigate to **Products** > **+ Add product**
3. Create product:
   - Name: "Dummy window"
   - Price: $1.00
   - One-time payment
   - Currency: USD
4. Copy the **Price ID** (starts with `price_`)
5. Update database with Price ID (see STRIPE_SETUP_INSTRUCTIONS.md)

### 3. Install Required Package (if needed)

If you get an error about `@stripe/react-stripe-js`, install it:

```bash
npm install @stripe/react-stripe-js
```

## Testing Authenticated User Flow

### Steps:
1. **Sign in** to your account
2. Navigate to `/storecatalogue`
3. **Search** for "Dummy window" or scroll to find it
4. **Click "Buy"** on the dummy product
5. Product modal opens - select quantity and click **"Buy Now"**
6. You'll be redirected to `/checkout` with payment form
7. **Enter test card**: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
8. Click **"Pay $1.00"**
9. Payment should succeed and redirect to `/storecatalogue?success=true`

### Alternative: Add to Cart First
1. Click product to open modal
2. Click **"Add to Cart"** instead of "Buy Now"
3. Click **cart icon** in navigation (left of theme toggle)
4. Review cart items
5. Click **"Proceed to Checkout"**
6. Complete payment as above

## Testing Guest User Flow

### Steps:
1. **Sign out** or use incognito/private window
2. Navigate to `/storecatalogue`
3. **Search** for "Dummy window" or scroll to find it
4. **Click "Buy"** on the dummy product
5. Product modal opens - select quantity and click **"Buy Now"**
6. You'll be redirected to `/guest-checkout`
7. **Fill in guest information:**
   - Email: test@example.com
   - Full Name: Test User
   - Phone: (555) 123-4567 (optional)
   - Address: 123 Test St
   - City: Test City
   - State: CA
   - ZIP: 12345
8. **Enter payment card**: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
9. Click **"Complete Purchase"**
10. Payment should succeed and redirect to `/storecatalogue?success=true&guest=true`

### Alternative: Add to Cart as Guest
1. Click product to open modal
2. Click **"Add to Cart"**
3. Click **cart icon** in navigation
4. Click **"Proceed to Checkout"**
5. You'll be redirected to `/guest-checkout`
6. Complete guest information and payment

## Testing from Home Page

### Authenticated User:
1. Sign in
2. Go to home page (`/`)
3. Scroll to "Order from our standard catalogue" section
4. Find "Dummy window" (if visible) or click "View All"
5. Click "Buy" on dummy product
6. **You'll be redirected to `/storecatalogue` first** (as per plan)
7. Product will be highlighted
8. Click "Buy" again from storecatalogue
9. Complete checkout

### Guest User:
1. Go to home page (not signed in)
2. Scroll to "Order from our standard catalogue" section
3. Find "Dummy window" or click "View All"
4. Click "Buy" on dummy product
5. **You'll be redirected directly to `/guest-checkout`**
6. Complete guest information and payment

## Cart Functionality

### Adding Items:
- Click any product's "Buy" button
- In product modal, click "Add to Cart"
- Item appears in cart (badge shows count)

### Viewing Cart:
- Click **cart icon** in navigation (left of theme toggle)
- Only visible on `/store` and `/storecatalogue` pages
- Cart sidebar opens from right

### Cart Features:
- View all items
- Adjust quantities (+/-)
- Remove items
- See total price
- Proceed to checkout

## Expected Behavior

### Authenticated Users:
- ✅ Can buy directly from product modal
- ✅ Can add to cart and checkout from cart
- ✅ From home page, routes to storecatalogue first
- ✅ From store/storecatalogue, goes directly to checkout
- ✅ Payment uses authenticated checkout flow

### Guest Users:
- ✅ Can buy directly from product modal (routes to guest-checkout)
- ✅ Can add to cart and checkout from cart (routes to guest-checkout)
- ✅ Guest checkout collects: email, name, phone, shipping address
- ✅ Payment uses guest checkout flow
- ✅ No account required

## Troubleshooting

### Dummy Product Not Showing:
- Run `node scripts/create-dummy-product.js` again
- Check database: `SELECT * FROM products WHERE slug = 'dummy-window';`
- Verify status is 'active'

### Payment Fails:
- Check Stripe Dashboard > Logs for errors
- Verify API keys are set correctly
- Ensure you're in Test mode for testing
- Check browser console for errors

### Guest Checkout Not Working:
- Verify `/api/products/checkout/guest` endpoint exists
- Check that Stripe keys are configured
- Verify cart has items before redirecting

### Cart Not Showing:
- Ensure you're on `/store` or `/storecatalogue` page
- Check that CartProvider is wrapping the app (in `_app.js`)
- Verify cart icon is in Navigation component

## Test Cards

Use these Stripe test cards:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Insufficient Funds**: `4000 0000 0000 9995`

All cards:
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

## Verification Checklist

- [ ] Dummy product created in database
- [ ] Dummy product created in Stripe Dashboard
- [ ] Stripe Price ID linked to database product
- [ ] Cart button visible on store pages
- [ ] Authenticated checkout works
- [ ] Guest checkout works
- [ ] Cart functionality works
- [ ] Payment succeeds with test card
- [ ] Success redirect works
- [ ] Product appears in storecatalogue search

## Next Steps

After testing:
1. Create real products in Stripe
2. Link Stripe Price IDs to database products
3. Test with real product prices
4. Set up webhooks for production
5. Switch to live mode when ready
