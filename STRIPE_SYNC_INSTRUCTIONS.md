# Stripe Product Sync Instructions

## Prerequisites

1. **Environment Variables** - Make sure you have these in your `.env.local` file:
   ```
   STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
   DATABASE_URL=postgresql://...
   ```

2. **Dependencies** - Make sure you have installed:
   ```bash
   npm install stripe @prisma/client dotenv
   ```

3. **Database** - Your database should have products in:
   - `products` table
   - `house_build_products` table

## Running the Script

### Step 1: Test Run (Dry Run)
First, run in dry-run mode to see what would happen without making changes:

```bash
node scripts/sync-products-to-stripe.js --dry-run
```

This will:
- Show you all products that would be synced
- Show what Stripe Products/Prices would be created
- **NOT** actually create anything in Stripe
- **NOT** update your database

### Step 2: Sync Only Products Without stripe_price_id
If you want to only sync products that don't have a `stripe_price_id` yet:

```bash
node scripts/sync-products-to-stripe.js --update-only
```

### Step 3: Full Sync (All Products)
To sync ALL products (even if they already have a stripe_price_id):

```bash
node scripts/sync-products-to-stripe.js
```

⚠️ **Warning**: This will create new Stripe Products/Prices even if they already exist. Use `--update-only` for normal use.

## What the Script Does

1. **Reads products** from your database (`products` and `house_build_products` tables)
2. **Creates Stripe Products** with:
   - Name
   - Description
   - Image (if available)
   - Metadata (product_id, table, slug)
3. **Creates Stripe Prices** with:
   - Amount (in cents)
   - Currency
   - One-time payment type
4. **Updates database** with the `stripe_price_id` for each product

## Troubleshooting

### "STRIPE_SECRET_KEY environment variable is not set"
- Make sure you have `.env.local` file in the project root
- Check that `STRIPE_SECRET_KEY` is set in that file
- The script looks for `.env.local` specifically

### "No products found"
- Check your database has products in `products` or `house_build_products` tables
- Products must have `status = 'active'` to be synced
- Run a database query to check:
  ```sql
  SELECT COUNT(*) FROM products WHERE status = 'active';
  SELECT COUNT(*) FROM house_build_products WHERE status = 'active';
  ```

### Products not appearing in Stripe Dashboard
- Check you're using the correct Stripe account (test vs live)
- Make sure the script completed successfully (check for errors)
- Verify the `stripe_price_id` was saved to your database:
  ```sql
  SELECT id, name, stripe_price_id FROM products WHERE stripe_price_id IS NOT NULL;
  ```

### Script runs but nothing happens
- Check if products already have `stripe_price_id` set
- Use `--update-only` to only sync products without `stripe_price_id`
- Remove `--update-only` flag to sync all products

## Example Output

```
🚀 Starting Stripe Product Sync
Mode: LIVE (changes will be saved)
Update Mode: Sync all products

📦 Syncing products from `products` table...
Found 5 products to sync

[products] Processing: Casement Window (clxxx...)
  Price: 1800 USD
  Existing Stripe Price ID: None
  ✓ Created Stripe Product: prod_xxxxx
  ✓ Created Stripe Price: price_xxxxx
  ✓ Updated database with stripe_price_id

📊 Sync Summary
============================================================
Products Table:
  Total: 5
  Synced: 5
  Skipped: 0
  Errors: 0

House Build Products Table:
  Total: 10
  Synced: 10
  Skipped: 0
  Errors: 0
============================================================
✅ Successfully synced 15 product(s)
```

## After Running

1. **Check Stripe Dashboard**: Go to Products in your Stripe dashboard to see the synced products
2. **Verify Database**: Check that `stripe_price_id` is populated:
   ```sql
   SELECT name, stripe_price_id FROM products;
   ```
3. **Test Checkout**: Try using one of the synced products in your checkout flow

## Important Notes

- **Test Mode vs Live Mode**: Make sure your `STRIPE_SECRET_KEY` matches the environment you want to sync to
- **Idempotency**: The script will create new products each time. If you run it multiple times, you'll get duplicate products in Stripe
- **Use `--update-only`**: This flag ensures you only sync products that don't have a `stripe_price_id` yet, preventing duplicates
