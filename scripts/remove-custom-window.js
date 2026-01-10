const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Removing Custom Window product...\n');

  try {
    const product = await prisma.product.findUnique({
      where: { slug: 'custom-window' },
    });

    if (product) {
      await prisma.product.delete({
        where: { slug: 'custom-window' },
      });
      console.log(`Deleted: ${product.name} (${product.slug})`);
    } else {
      console.log('Custom Window product not found');
    }
  } catch (error) {
    console.error('Error deleting custom-window:', error);
  }

  console.log('\nFinished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

