const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const oldProductSlugs = [
  'casement-window',
  'double-hung-window',
  'bay-window',
  'interior-door',
  'exterior-door',
  'sliding-door'
];

async function main() {
  console.log('Removing old products...\n');

  for (const slug of oldProductSlugs) {
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

  console.log('\nFinished removing old products!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

