/**
 * Sync products from database to Stripe
 * 
 * This script:
 * - Reads all products from `products` and `house_build_products` tables
 * - Creates Stripe Products and Prices for products without stripe_price_id
 * - Updates database with stripe_price_id
 * - Supports dry-run mode and update-only mode
 * 
 * Usage:
 *   node scripts/sync-products-to-stripe.js [--dry-run] [--update-only]
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const DRY_RUN = process.argv.includes('--dry-run');
const UPDATE_ONLY = process.argv.includes('--update-only');

async function syncProductToStripe(product, tableName) {
  const productId = product.id;
  const productName = product.name;
  const productDescription = product.description || '';
  const productPrice = product.price; // in cents
  const productCurrency = product.currency || 'usd';
  const productImage = product.image_url;
  const existingStripePriceId = product.stripe_price_id;

  console.log(`\n[${tableName}] Processing: ${productName} (${productId})`);
  console.log(`  Price: ${productPrice / 100} ${productCurrency.toUpperCase()}`);
  console.log(`  Existing Stripe Price ID: ${existingStripePriceId || 'None'}`);

  // Skip if already has stripe_price_id and UPDATE_ONLY mode
  if (UPDATE_ONLY && existingStripePriceId) {
    console.log(`  ⏭️  Skipping (already has stripe_price_id in update-only mode)`);
    return { skipped: true, product };
  }

  // Skip if product is not active
  if (product.status !== 'active') {
    console.log(`  ⏭️  Skipping (status: ${product.status})`);
    return { skipped: true, product, reason: 'inactive' };
  }

  try {
    let stripeProduct;
    let stripePrice;

    if (existingStripePriceId) {
      // Check if price still exists in Stripe
      try {
        const existingPrice = await stripe.prices.retrieve(existingStripePriceId);
        const existingProduct = await stripe.products.retrieve(existingPrice.product);
        
        console.log(`  ✓ Found existing Stripe Price: ${existingStripePriceId}`);
        console.log(`  ✓ Found existing Stripe Product: ${existingProduct.id}`);
        
        // Verify price matches
        if (existingPrice.unit_amount === productPrice && existingPrice.currency === productCurrency) {
          console.log(`  ✓ Price matches, no update needed`);
          return { skipped: true, product, reason: 'already_synced' };
        } else {
          console.log(`  ⚠️  Price mismatch, creating new price`);
          stripeProduct = existingProduct;
        }
      } catch (error) {
        if (error.code === 'resource_missing') {
          console.log(`  ⚠️  Existing Stripe Price not found, creating new one`);
        } else {
          throw error;
        }
      }
    }

    // Create Stripe Product if needed
    if (!stripeProduct) {
      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would create Stripe Product: ${productName}`);
        stripeProduct = { id: 'prod_DRYRUN' };
      } else {
        stripeProduct = await stripe.products.create({
          name: productName,
          description: productDescription,
          images: productImage ? [productImage] : undefined,
          metadata: {
            product_id: productId,
            table: tableName,
            slug: product.slug || '',
          },
        });
        console.log(`  ✓ Created Stripe Product: ${stripeProduct.id}`);
      }
    }

    // Create Stripe Price
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would create Stripe Price: ${productPrice / 100} ${productCurrency.toUpperCase()}`);
      stripePrice = { id: 'price_DRYRUN' };
    } else {
      stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: productPrice,
        currency: productCurrency,
        metadata: {
          product_id: productId,
          table: tableName,
        },
      });
      console.log(`  ✓ Created Stripe Price: ${stripePrice.id}`);
    }

    // Update database with stripe_price_id
    if (!DRY_RUN) {
      if (tableName === 'products') {
        await prisma.product.update({
          where: { id: productId },
          data: { stripe_price_id: stripePrice.id },
        });
      } else if (tableName === 'house_build_products') {
        // Uncomment when enabling house_build_products sync:
        // await prisma.houseBuildProduct.update({
        //   where: { id: productId },
        //   data: { stripe_price_id: stripePrice.id },
        // });
        console.log(`  ⚠️  Skipping database update for house_build_products (disabled)`);
      }
      console.log(`  ✓ Updated database with stripe_price_id`);
    }

    return {
      success: true,
      product,
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id,
    };
  } catch (error) {
    console.error(`  ❌ Error syncing product:`, error.message);
    return {
      success: false,
      product,
      error: error.message,
    };
  }
}

async function main() {
  console.log('🚀 Starting Stripe Product Sync');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be saved)'}`);
  console.log(`Update Mode: ${UPDATE_ONLY ? 'Update only (skip products with stripe_price_id)' : 'Sync all products'}`);
  console.log('');

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Error: STRIPE_SECRET_KEY environment variable is not set');
    process.exit(1);
  }

  const results = {
    products: { total: 0, synced: 0, skipped: 0, errors: 0 },
    houseBuildProducts: { total: 0, synced: 0, skipped: 0, errors: 0 },
  };

  try {
    // Sync products from `products` table
    console.log('📦 Syncing products from `products` table...');
    const products = await prisma.product.findMany({
      where: UPDATE_ONLY ? { stripe_price_id: null } : undefined,
    });
    results.products.total = products.length;
    console.log(`Found ${products.length} products to sync`);

    for (const product of products) {
      const result = await syncProductToStripe(product, 'products');
      if (result.success) {
        results.products.synced++;
      } else if (result.skipped) {
        results.products.skipped++;
      } else {
        results.products.errors++;
      }
    }

    // Sync products from `house_build_products` table
    // SKIPPED: Not syncing house_build_products for now
    console.log('\n🏠 Syncing products from `house_build_products` table...');
    console.log('⏭️  Skipping house_build_products (disabled for now)');
    
    // Uncomment below to enable house_build_products sync:
    /*
    const houseBuildProducts = await prisma.houseBuildProduct.findMany({
      where: UPDATE_ONLY ? { stripe_price_id: null } : undefined,
    });
    results.houseBuildProducts.total = houseBuildProducts.length;
    console.log(`Found ${houseBuildProducts.length} products to sync`);

    for (const product of houseBuildProducts) {
      const result = await syncProductToStripe(product, 'house_build_products');
      if (result.success) {
        results.houseBuildProducts.synced++;
      } else if (result.skipped) {
        results.houseBuildProducts.skipped++;
      } else {
        results.houseBuildProducts.errors++;
      }
    }
    */

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Sync Summary');
    console.log('='.repeat(60));
    console.log('\nProducts Table:');
    console.log(`  Total: ${results.products.total}`);
    console.log(`  Synced: ${results.products.synced}`);
    console.log(`  Skipped: ${results.products.skipped}`);
    console.log(`  Errors: ${results.products.errors}`);
    console.log('\nHouse Build Products Table:');
    console.log(`  Total: ${results.houseBuildProducts.total}`);
    console.log(`  Synced: ${results.houseBuildProducts.synced}`);
    console.log(`  Skipped: ${results.houseBuildProducts.skipped}`);
    console.log(`  Errors: ${results.houseBuildProducts.errors}`);
    console.log('\n' + '='.repeat(60));

    const totalSynced = results.products.synced + results.houseBuildProducts.synced;
    const totalErrors = results.products.errors + results.houseBuildProducts.errors;

    if (totalErrors > 0) {
      console.log(`⚠️  Completed with ${totalErrors} error(s)`);
      process.exit(1);
    } else if (totalSynced > 0) {
      console.log(`✅ Successfully synced ${totalSynced} product(s)`);
    } else {
      console.log(`ℹ️  No products needed syncing`);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
