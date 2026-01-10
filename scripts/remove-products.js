const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const productsToRemove = [
  'hinges',
  'lock-set',
  'door-handle-set',
  'custom-door',
  'metro-casing',  // M-101
  'tall-baseboard', // M-201
  'soft-crown'     // M-301
];

async function main() {
  console.log('Removing products...\n');

  for (const slug of productsToRemove) {
    try {
      const product = await prisma.product.findUnique({
        where: { slug },
      });

      if (product) {
        await prisma.product.delete({
          where: { slug },
        });
        console.log(`Deleted: ${product.name} (${slug})`);
      } else {
        console.log(`Product not found: ${slug}`);
      }
    } catch (error) {
      console.error(`Error deleting ${slug}:`, error);
    }
  }

  console.log('\nFinished removing products!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

