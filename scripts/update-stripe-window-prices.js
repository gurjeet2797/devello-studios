/**
 * Update Stripe prices for window products with variants
 * 
 * This script:
 * - Reads window products from database
 * - Creates Stripe prices for each variant (Black Aluminum Frame and Dark Bronze)
 * - Stores variant price IDs in product metadata
 * - Supports dry-run mode
 * 
 * Usage:
 *   node scripts/update-stripe-window-prices.js [--dry-run]
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const DRY_RUN = process.argv.includes('--dry-run');

// Window product slugs to update
const windowSlugs = [
  'single-hung-window',
  'casement-window',
  'single-hung-paneled-glass-window',
  'french-door-paneled-glass-window',
  'double-hung-window',
  'sliding-window',
];

function parseMetadata(metadata) {
  if (!metadata) return {};
  if (typeof metadata === 'object') return metadata;
  try {
    return JSON.parse(metadata);
  } catch (err) {
    console.warn('Could not parse metadata, resetting to empty object');
    return {};
  }
}

async function syncWindowVariantsToStripe(product) {
  const productId = product.id;
  const productName = product.name;
  const productDescription = product.description || '';
  const productImage = product.image_url;
  const metadata = parseMetadata(product.metadata);
  const variants = metadata.variants || [];

  console.log(`\nProcessing: ${productName} (${productId})`);
  console.log(`  Slug: ${product.slug}`);
  console.log(`  Variants: ${variants.length}`);

  if (variants.length === 0) {
    console.log(`  ⏭️  Skipping (no variants found)`);
    return { skipped: true, product, reason: 'no_variants' };
  }

  if (product.status !== 'active') {
    console.log(`  ⏭️  Skipping (status: ${product.status})`);
    return { skipped: true, product, reason: 'inactive' };
  }

  try {
    let stripeProduct;
    const existingStripePriceId = product.stripe_price_id;

    // Check if Stripe product already exists
    if (existingStripePriceId) {
      try {
        const existingPrice = await stripe.prices.retrieve(existingStripePriceId);
        stripeProduct = await stripe.products.retrieve(existingPrice.product);
        console.log(`  ✓ Found existing Stripe Product: ${stripeProduct.id}`);
      } catch (error) {
        if (error.code === 'resource_missing') {
          console.log(`  ⚠️  Existing Stripe Price not found, will create new product`);
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
            table: 'products',
            slug: product.slug || '',
          },
        });
        console.log(`  ✓ Created Stripe Product: ${stripeProduct.id}`);
      }
    }

    // Create Stripe prices for each variant
    const variantPriceIds = {};
    const updatedVariants = [];

    for (const variant of variants) {
      const variantName = variant.name;
      const variantPrice = variant.price; // in cents
      const variantCurrency = 'usd';

      console.log(`  Creating price for variant: ${variantName} - $${(variantPrice / 100).toFixed(2)}`);

      if (DRY_RUN) {
        console.log(`    [DRY RUN] Would create Stripe Price: ${variantPrice / 100} ${variantCurrency.toUpperCase()}`);
        variantPriceIds[variantName] = 'price_DRYRUN';
      } else {
        const stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: variantPrice,
          currency: variantCurrency,
          metadata: {
            product_id: productId,
            variant_name: variantName,
            table: 'products',
          },
        });
        console.log(`    ✓ Created Stripe Price: ${stripePrice.id}`);
        variantPriceIds[variantName] = stripePrice.id;
      }

      // Add price ID to variant metadata
      updatedVariants.push({
        ...variant,
        stripePriceId: variantPriceIds[variantName],
      });
    }

    // Update database with variant price IDs in metadata
    if (!DRY_RUN) {
      const updatedMetadata = {
        ...metadata,
        variants: updatedVariants,
        stripeProductId: stripeProduct.id,
      };

      await prisma.product.update({
        where: { id: productId },
        data: {
          metadata: updatedMetadata,
          // Set base stripe_price_id to the bronze (lowest) variant price
          stripe_price_id: variantPriceIds['Dark Bronze'] || variantPriceIds[Object.keys(variantPriceIds)[0]],
        },
      });

      console.log(`  ✓ Updated database with variant price IDs`);
    }

    return {
      success: true,
      product,
      stripeProductId: stripeProduct.id,
      variantPriceIds,
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
  console.log('🚀 Starting Stripe Window Variants Price Update');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be saved)'}`);
  console.log('');

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Error: STRIPE_SECRET_KEY environment variable is not set');
    process.exit(1);
  }

  const results = {
    total: 0,
    synced: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Fetch window products
    console.log('📦 Fetching window products...');
    const products = await prisma.product.findMany({
      where: {
        slug: { in: windowSlugs },
        status: 'active',
      },
    });

    results.total = products.length;
    console.log(`Found ${products.length} window products to sync\n`);

    for (const product of products) {
      const result = await syncWindowVariantsToStripe(product);
      if (result.success) {
        results.synced++;
      } else if (result.skipped) {
        results.skipped++;
      } else {
        results.errors++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`  Total: ${results.total}`);
    console.log(`  Synced: ${results.synced}`);
    console.log(`  Skipped: ${results.skipped}`);
    console.log(`  Errors: ${results.errors}`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

