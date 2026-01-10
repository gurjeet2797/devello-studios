/* 
 * Update window products with new black/bronze variants, images, and pricing.
 * Usage:
 *   node scripts/update-window-products.js --dry-run
 *   node scripts/update-window-products.js
 */
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

const windowUpdates = [
  {
    slug: 'single-hung-window',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_18e2472a60f0427f8e5bd18050e0589c~mv2.jpg',
    price: 51000,
    variants: [
      {
        name: 'Black Aluminum Frame',
        material: 'Aluminum',
        price: 63000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_18e2472a60f0427f8e5bd18050e0589c~mv2.jpg',
        notes: 'Slim aluminum frame, black finish',
      },
      {
        name: 'Dark Bronze',
        material: 'Aluminum',
        price: 51000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_674f13ba5b9343e98d2884e86cfd80b8~mv2.jpg',
        notes: 'Dark bronze finish',
      },
    ],
  },
  {
    slug: 'casement-window',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_79ee2fc8e57747ebbb7e817331e16904~mv2.jpg',
    price: 105000,
    variants: [
      {
        name: 'Black Aluminum Frame',
        material: 'Aluminum',
        price: 120000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_79ee2fc8e57747ebbb7e817331e16904~mv2.jpg',
        notes: 'Black finish, aluminum frame',
      },
      {
        name: 'Dark Bronze',
        material: 'Aluminum',
        price: 105000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_b3a6aefcb7c74aef942eb70d8fe09e61~mv2.jpg',
        notes: 'Dark bronze finish',
      },
    ],
  },
  {
    slug: 'single-hung-paneled-glass-window',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_9942e7f4659046e591871659e78e4212~mv2.webp',
    price: 59000,
    variants: [
      {
        name: 'Black Aluminum Frame',
        material: 'Aluminum + paneled glass',
        price: 71000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_9942e7f4659046e591871659e78e4212~mv2.webp',
        notes: 'Black aluminum frame, paneled glass',
      },
      {
        name: 'Dark Bronze',
        material: 'Aluminum + paneled glass',
        price: 59000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_fcbe98bfa8bd4b0888544d41d167d202~mv2.jpg',
        notes: 'Dark bronze finish',
      },
    ],
  },
  {
    slug: 'french-door-paneled-glass-window',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_14ee06788e804ef7b1d06b2e318008d1~mv2.jpg',
    price: 228300,
    variants: [
      {
        name: 'Black Aluminum Frame',
        material: 'Aluminum + glass',
        price: 280000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_14ee06788e804ef7b1d06b2e318008d1~mv2.jpg',
        notes: 'Black finish, aluminum frame',
      },
      {
        name: 'Dark Bronze',
        material: 'Aluminum + glass',
        price: 228300,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_04d0213c4c4d437ab5858126467ed417~mv2.jpg',
        notes: 'Dark bronze finish',
      },
    ],
  },
  {
    slug: 'double-hung-window',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_7c0ab7f3943a47669f36f98e467d654d~mv2.jpg',
    price: 53000,
    variants: [
      {
        name: 'Black Aluminum Frame',
        material: 'Aluminum',
        price: 65000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_7c0ab7f3943a47669f36f98e467d654d~mv2.jpg',
        notes: 'Black aluminum frame finish',
      },
      {
        name: 'Dark Bronze',
        material: 'Aluminum',
        price: 53000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_9b6abd3e512e4feab166baeace69a8ec~mv2.jpg',
        notes: 'Dark bronze finish',
      },
    ],
  },
  {
    slug: 'sliding-window',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_86bf2b9661794f0c892bfb6d94d7dda6~mv2.jpg',
    price: 61000,
    variants: [
      {
        name: 'Black Aluminum Frame',
        material: 'Aluminum',
        price: 73000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_86bf2b9661794f0c892bfb6d94d7dda6~mv2.jpg',
        notes: 'Black aluminum frame finish',
      },
      {
        name: 'Dark Bronze',
        material: 'Aluminum',
        price: 61000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_0316f6094f444f96ba88d40ba28d6152~mv2.jpg',
        notes: 'Dark bronze finish',
      },
    ],
  },
];

const patioDoorUpdate = {
  slug: 'metal-patio-door',
  price: 220000,
};

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

async function updateProduct({ slug, imageUrl, price, variants }) {
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) {
    console.warn(`⚠️  Product not found for slug: ${slug}`);
    return { skipped: true, slug };
  }

  const metadata = parseMetadata(product.metadata);
  const newMetadata = { ...metadata, variants };

  console.log(`\nUpdating ${product.name} (${slug})`);
  console.log(`  New price: $${(price / 100).toFixed(2)}`);
  console.log(`  Image: ${imageUrl}`);
  if (DRY_RUN) {
    console.log('  [DRY RUN] No database changes will be saved.');
    return { dryRun: true, slug };
  }

  await prisma.product.update({
    where: { slug },
    data: {
      price,
      image_url: imageUrl,
      metadata: newMetadata,
    },
  });

  console.log('  ✓ Updated product');
  return { success: true, slug };
}

async function updatePatioDoor({ slug, price }) {
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) {
    console.warn(`⚠️  Metal patio door not found for slug: ${slug}`);
    return { skipped: true, slug };
  }

  console.log(`\nUpdating Metal Patio Door (${slug})`);
  console.log(`  New price: $${(price / 100).toFixed(2)}`);
  if (DRY_RUN) {
    console.log('  [DRY RUN] No database changes will be saved.');
    return { dryRun: true, slug };
  }

  const metadata = parseMetadata(product.metadata);
  await prisma.product.update({
    where: { slug },
    data: {
      price,
      metadata,
    },
  });

  console.log('  ✓ Updated metal patio door price');
  return { success: true, slug };
}

async function main() {
  try {
    console.log(`Starting window product updates (${DRY_RUN ? 'dry run' : 'live'})`);
    for (const update of windowUpdates) {
      await updateProduct(update);
    }
    await updatePatioDoor(patioDoorUpdate);
    console.log('\nAll updates processed.');
  } catch (error) {
    console.error('❌ Error updating products:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

