const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DUMMY_WINDOW_SLUG = 'dummy-window';

async function upsertDummyWindowProduct() {
  return prisma.product.upsert({
    where: { slug: DUMMY_WINDOW_SLUG },
    update: {
      is_test: true,
      visible_in_catalog: true, // Enable in production for testing
      status: 'active',
    },
    create: {
      name: 'Dummy Window',
      description: 'Test product used to validate checkout and payment flows.',
      slug: DUMMY_WINDOW_SLUG,
      price: 1000,
      currency: 'usd',
      product_type: 'one_time',
      status: 'active',
      is_test: true,
      visible_in_catalog: true, // Enable in production for testing
      metadata: {
        variants: [
          {
            name: 'Standard',
            price: 1000,
          },
        ],
      },
    },
  });
}

async function main() {
  const product = await upsertDummyWindowProduct();
  console.log('[SEED] Dummy window product ready:', product.slug);
}

main()
  .catch((error) => {
    console.error('[SEED] Failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

