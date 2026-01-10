const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Removing old recessed lighting products...\n');

  const productsToRemove = [
    'lithonia-wafer-6-led-downlight',
    'juno-4-slim-selectable-led-downlight',
    'halo-4-gimbal-led-downlight',
  ];

  for (const slug of productsToRemove) {
    try {
      const product = await prisma.product.findUnique({
        where: { slug },
      });

      if (product) {
        // Set status to inactive instead of deleting (safer)
        await prisma.product.update({
          where: { slug },
          data: {
            status: 'inactive',
            visible_in_catalog: false,
          },
        });
        console.log(`✅ Deactivated: ${product.name} (${slug})`);
      } else {
        console.log(`⚠️  Product not found: ${slug}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${slug}:`, error);
    }
  }

  console.log(`\n✅ Finished removing old recessed lighting products!`);
}

main()
  .catch((e) => {
    console.error('❌ Failed to remove products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
