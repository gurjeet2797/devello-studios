/**
 * Sync Phase 5 Products (Lighting & Bathroom) to Stripe
 * 
 * This script:
 * - Reads Phase 5 products (lighting and bathroom categories) from database
 * - Creates Stripe Products and Prices for products without stripe_price_id
 * - Updates database with stripe_price_id
 * - Supports dry-run mode
 * 
 * Usage:
 *   node scripts/sync-phase5-products-to-stripe.js [--dry-run]
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const DRY_RUN = process.argv.includes('--dry-run');

async function syncProductToStripe(product) {
  const productId = product.id;
  const productName = product.name;
  const productDescription = product.description || '';
  const productPrice = product.price; // in cents
  const productCurrency = product.currency || 'usd';
  const productImage = product.image_url;
  const existingStripePriceId = product.stripe_price_id;
  const productCategory = product.metadata?.category || 'unknown';
  const productIdFromMeta = product.metadata?.productId || '';

  console.log(`\n[${productCategory.toUpperCase()}] Processing: ${productName}`);
  console.log(`  Product ID: ${productIdFromMeta || productId}`);
  console.log(`  Price: $${(productPrice / 100).toFixed(2)} ${productCurrency.toUpperCase()}`);
  console.log(`  Existing Stripe Price ID: ${existingStripePriceId || 'None'}`);

  // Skip if already has stripe_price_id
  if (existingStripePriceId) {
    // Verify the price still exists in Stripe
    try {
      const existingPrice = await stripe.prices.retrieve(existingStripePriceId);
      const existingProduct = await stripe.products.retrieve(existingPrice.product);
      
      // Verify price matches
      if (existingPrice.unit_amount === productPrice && existingPrice.currency === productCurrency) {
        console.log(`  ✓ Already synced to Stripe (Price: ${existingStripePriceId})`);
        return { skipped: true, product, reason: 'already_synced' };
      } else {
        console.log(`  ⚠️  Price mismatch, will create new price`);
      }
    } catch (error) {
      if (error.code === 'resource_missing') {
        console.log(`  ⚠️  Existing Stripe Price not found, will create new one`);
      } else {
        throw error;
      }
    }
  }

  // Skip if product is not active
  if (product.status !== 'active') {
    console.log(`  ⏭️  Skipping (status: ${product.status})`);
    return { skipped: true, product, reason: 'inactive' };
  }

  try {
    let stripeProduct;
    let stripePrice;

    // Create or update Stripe Product
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would create Stripe Product: ${productName}`);
      stripeProduct = { id: 'prod_DRYRUN' };
    } else {
      // Check if product already exists by metadata
      if (existingStripePriceId) {
        try {
          const existingPrice = await stripe.prices.retrieve(existingStripePriceId);
          stripeProduct = await stripe.products.retrieve(existingPrice.product);
          console.log(`  ✓ Found existing Stripe Product: ${stripeProduct.id}`);
          
          // Update product if needed
          await stripe.products.update(stripeProduct.id, {
            name: productName,
            description: productDescription,
            images: productImage ? [productImage] : undefined,
            metadata: {
              product_id: productId,
              table: 'products',
              slug: product.slug || '',
              category: productCategory,
              productId: productIdFromMeta,
            },
          });
          console.log(`  ✓ Updated Stripe Product`);
        } catch (error) {
          // Product doesn't exist, create new one
          stripeProduct = await stripe.products.create({
            name: productName,
            description: productDescription,
            images: productImage ? [productImage] : undefined,
            metadata: {
              product_id: productId,
              table: 'products',
              slug: product.slug || '',
              category: productCategory,
              productId: productIdFromMeta,
            },
          });
          console.log(`  ✓ Created Stripe Product: ${stripeProduct.id}`);
        }
      } else {
        stripeProduct = await stripe.products.create({
          name: productName,
          description: productDescription,
          images: productImage ? [productImage] : undefined,
          metadata: {
            product_id: productId,
            table: 'products',
            slug: product.slug || '',
            category: productCategory,
            productId: productIdFromMeta,
          },
        });
        console.log(`  ✓ Created Stripe Product: ${stripeProduct.id}`);
      }
    }

    // Create Stripe Price
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would create Stripe Price: $${(productPrice / 100).toFixed(2)} ${productCurrency.toUpperCase()}`);
      stripePrice = { id: 'price_DRYRUN' };
    } else {
      // Check if we need to create a new price (if price changed or doesn't exist)
      if (existingStripePriceId) {
        try {
          const existingPrice = await stripe.prices.retrieve(existingStripePriceId);
          if (existingPrice.unit_amount === productPrice && existingPrice.currency === productCurrency) {
            stripePrice = existingPrice;
            console.log(`  ✓ Using existing Stripe Price: ${stripePrice.id}`);
          } else {
            // Price changed, create new price
            stripePrice = await stripe.prices.create({
              product: stripeProduct.id,
              unit_amount: productPrice,
              currency: productCurrency,
              metadata: {
                product_id: productId,
                table: 'products',
                category: productCategory,
                productId: productIdFromMeta,
              },
            });
            console.log(`  ✓ Created new Stripe Price: ${stripePrice.id} (price changed)`);
          }
        } catch (error) {
          // Price doesn't exist, create new one
          stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: productPrice,
            currency: productCurrency,
            metadata: {
              product_id: productId,
              table: 'products',
              category: productCategory,
              productId: productIdFromMeta,
            },
          });
          console.log(`  ✓ Created Stripe Price: ${stripePrice.id}`);
        }
      } else {
        stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: productPrice,
          currency: productCurrency,
          metadata: {
            product_id: productId,
            table: 'products',
            category: productCategory,
            productId: productIdFromMeta,
          },
        });
        console.log(`  ✓ Created Stripe Price: ${stripePrice.id}`);
      }
    }

    // Update database with stripe_price_id
    if (!DRY_RUN) {
      await prisma.product.update({
        where: { id: productId },
        data: { stripe_price_id: stripePrice.id },
      });
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
    if (error.response) {
      console.error(`  Stripe API Error:`, error.response);
    }
    return {
      success: false,
      product,
      error: error.message,
    };
  }
}

async function main() {
  console.log('🚀 Starting Phase 5 Products Stripe Sync');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be saved)'}`);
  console.log('');

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Error: STRIPE_SECRET_KEY environment variable is not set');
    console.error('   Make sure you have STRIPE_SECRET_KEY in your .env.local file');
    process.exit(1);
  }

  const results = {
    lighting: { total: 0, synced: 0, skipped: 0, errors: 0 },
    bathroom: { total: 0, synced: 0, skipped: 0, errors: 0 },
  };

  try {
    // Sync lighting products
    console.log('💡 Syncing Lighting products...');
    const lightingProducts = await prisma.product.findMany({
      where: {
        metadata: {
          path: ['category'],
          equals: 'lighting',
        },
        status: 'active',
      },
    });
    results.lighting.total = lightingProducts.length;
    console.log(`Found ${lightingProducts.length} lighting products to sync\n`);

    for (const product of lightingProducts) {
      const result = await syncProductToStripe(product);
      if (result.success) {
        results.lighting.synced++;
      } else if (result.skipped) {
        results.lighting.skipped++;
      } else {
        results.lighting.errors++;
      }
    }

    // Sync bathroom products
    console.log('\n🚿 Syncing Bathroom products...');
    const bathroomProducts = await prisma.product.findMany({
      where: {
        metadata: {
          path: ['category'],
          equals: 'bathroom',
        },
        status: 'active',
      },
    });
    results.bathroom.total = bathroomProducts.length;
    console.log(`Found ${bathroomProducts.length} bathroom products to sync\n`);

    for (const product of bathroomProducts) {
      const result = await syncProductToStripe(product);
      if (result.success) {
        results.bathroom.synced++;
      } else if (result.skipped) {
        results.bathroom.skipped++;
      } else {
        results.bathroom.errors++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Sync Summary');
    console.log('='.repeat(60));
    console.log('\n💡 Lighting Products:');
    console.log(`  Total: ${results.lighting.total}`);
    console.log(`  Synced: ${results.lighting.synced}`);
    console.log(`  Skipped: ${results.lighting.skipped}`);
    console.log(`  Errors: ${results.lighting.errors}`);
    console.log('\n🚿 Bathroom Products:');
    console.log(`  Total: ${results.bathroom.total}`);
    console.log(`  Synced: ${results.bathroom.synced}`);
    console.log(`  Skipped: ${results.bathroom.skipped}`);
    console.log(`  Errors: ${results.bathroom.errors}`);
    console.log('\n' + '='.repeat(60));

    const totalSynced = results.lighting.synced + results.bathroom.synced;
    const totalErrors = results.lighting.errors + results.bathroom.errors;

    if (totalErrors > 0) {
      console.log(`⚠️  Completed with ${totalErrors} error(s)`);
      process.exit(1);
    } else if (totalSynced > 0) {
      console.log(`✅ Successfully synced ${totalSynced} product(s) to Stripe`);
      console.log(`\n🎉 Phase 5 products are now live and ready for purchase!`);
    } else {
      console.log(`ℹ️  No products needed syncing (all already have stripe_price_id)`);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
