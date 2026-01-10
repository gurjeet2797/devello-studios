const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findUnique({
    where: { slug: 'dummy-window' }
  });

  if (!product) {
    console.log('❌ Dummy window product not found!');
    console.log('Run: node scripts/create-dummy-product.js');
  } else {
    console.log('✅ Dummy window product found:');
    console.log({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      status: product.status,
      is_test: product.is_test,
      visible_in_catalog: product.visible_in_catalog,
      metadata: product.metadata
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
