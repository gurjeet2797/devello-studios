# Stripe Product Setup Instructions

This guide will help you set up products in Stripe and link them to your database for the payment flow.

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Access to Stripe Dashboard
- Database access to update product `stripe_price_id` field

## Step 1: Create Products in Stripe Dashboard

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** in the left sidebar
3. Click **+ Add product** button

### For Each Product:

1. **Product Information:**
   - **Name**: Enter the product name (e.g., "Dummy window")
   - **Description**: Enter product description (optional but recommended)
   - **Images**: Upload product images (optional)

2. **Pricing:**
   - **Pricing model**: Select "Standard pricing"
   - **Price**: Enter the price (e.g., $1.00 for dummy product)
   - **Billing period**: Select "One time" for one-time purchases
   - **Currency**: Select USD (or your preferred currency)

3. **Additional Settings:**
   - **Tax behavior**: Select appropriate tax setting
   - **Unit label**: Optional (e.g., "item", "window", "door")

4. Click **Save product**

5. **Copy the Price ID:**
   - After creating the product, you'll see a Price ID (starts with `price_`)
   - Copy this Price ID - you'll need it for the next step

## Step 2: Link Stripe Price ID to Database

### Option A: Using Database Admin Tool

1. Connect to your database (PostgreSQL)
2. Find the product in the `products` table
3. Update the `stripe_price_id` field with the Price ID from Stripe

```sql
UPDATE products 
SET stripe_price_id = 'price_xxxxxxxxxxxxx' 
WHERE slug = 'dummy-window';
```

### Option B: Using Admin API (if available)

If you have an admin API endpoint for updating products:

```bash
curl -X PUT https://your-domain.com/api/admin/products/{productId} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stripe_price_id": "price_xxxxxxxxxxxxx"
  }'
```

### Option C: Using Prisma Studio

1. Run `npx prisma studio`
2. Navigate to the `Product` model
3. Find your product
4. Edit the `stripe_price_id` field
5. Save

## Step 3: Create the Dummy Product

Run the script to create the dummy product in your database:

```bash
node scripts/create-dummy-product.js
```

Then follow Step 2 to add the Stripe Price ID to this product.

## Step 4: Test Mode vs Live Mode

### Test Mode (Development)

1. Make sure you're in **Test mode** in Stripe Dashboard (toggle in top right)
2. Use test API keys:
   - `STRIPE_SECRET_KEY` = Your test secret key (starts with `sk_test_`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = Your test publishable key (starts with `pk_test_`)

3. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires authentication: `4000 0025 0000 3155`
   - Any future expiry date, any CVC, any ZIP

### Live Mode (Production)

1. Switch to **Live mode** in Stripe Dashboard
2. Update environment variables with live keys:
   - `STRIPE_SECRET_KEY` = Your live secret key (starts with `sk_live_`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = Your live publishable key (starts with `pk_live_`)

3. **Important**: Never commit live keys to version control!

## Step 5: Webhook Configuration (Production)

For production, set up webhooks to handle payment events:

1. Go to **Developers** > **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter your webhook URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
   - `customer.created`
   - `customer.updated`

5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to your environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

## Step 6: Verify Setup

1. Test a purchase with the dummy product ($1.00)
2. Check Stripe Dashboard > **Payments** to see the payment
3. Verify the payment intent was created successfully
4. Check your database to ensure order records are created (if applicable)

## Testing the Dummy Product

### For Authenticated Users:
1. Sign in to your account
2. Navigate to `/storecatalogue`
3. Search for "Dummy window" or find it in the products list
4. Click "Buy" on the dummy product
5. Complete checkout with test card: `4242 4242 4242 4242`

### For Guest Users:
1. Navigate to `/storecatalogue` (without signing in)
2. Search for "Dummy window" or find it in the products list
3. Click "Buy" on the dummy product
4. You'll be redirected to `/guest-checkout`
5. Fill in guest information and payment details
6. Complete checkout with test card: `4242 4242 4242 4242`

## Troubleshooting

### Product Not Found in Stripe

- Verify the Price ID is correct
- Check that you're in the correct mode (Test vs Live)
- Ensure the product exists in Stripe Dashboard

### Payment Fails

- Check Stripe Dashboard > **Logs** for error messages
- Verify API keys are correct for the current mode
- Check that the product price matches between database and Stripe

### Webhook Not Receiving Events

- Verify webhook URL is accessible
- Check webhook signing secret is correct
- Review webhook logs in Stripe Dashboard

## Quick Reference

### Environment Variables Needed

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx  # or sk_live_ for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx  # or pk_live_ for production

# Webhook (Production only)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Database Schema

The `products` table should have:
- `id`: Product ID (string)
- `name`: Product name
- `slug`: Unique product slug
- `price`: Price in cents (integer)
- `stripe_price_id`: Stripe Price ID (string, nullable)
- `status`: Product status ('active', 'inactive', 'archived')
- `product_type`: Type ('one_time', 'subscription', 'service')

### API Endpoints

- **Create Payment Intent**: `/api/products/{id}/checkout` (authenticated)
- **Cart Checkout**: `/api/products/checkout/cart` (authenticated)
- **Guest Checkout**: `/api/products/checkout/guest` (no auth required)
- **Webhook Handler**: `/api/webhooks/stripe` (Stripe webhook)

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Support](https://support.stripe.com)
