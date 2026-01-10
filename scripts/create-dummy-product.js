const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const slug = 'dummy-window';
  const price = 100; // $1.00 in cents

  const product = await prisma.product.upsert({
    where: { slug },
    update: {
      name: 'Dummy window',
      description: 'Test-only $1.00 product for checkout validation',
      price,
      currency: 'usd',
      product_type: 'one_time',
      status: 'active',
      is_test: true,
      visible_in_catalog: true, // Enable in production for testing
      metadata: {
        category: 'windows',
        productId: 'W-DUMMY',
      },
    },
    create: {
      name: 'Dummy window',
      slug,
      description: 'Test-only $1.00 product for checkout validation',
      price,
      currency: 'usd',
      product_type: 'one_time',
      status: 'active',
      is_test: true,
      visible_in_catalog: true, // Enable in production for testing
      image_url: 'https://via.placeholder.com/600x400.png?text=Dummy+Window',
      metadata: {
        category: 'windows',
        productId: 'W-DUMMY',
      },
    },
  });

  console.log('✅ Dummy product upserted:', {
    id: product.id,
    slug: product.slug,
    price_cents: product.price,
    currency: product.currency,
    status: product.status,
    is_test: product.is_test,
    visible_in_catalog: product.visible_in_catalog,
  });
}

main()
  .catch((e) => {
    console.error('❌ Failed to upsert dummy product:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
