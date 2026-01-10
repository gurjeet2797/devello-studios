const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const manufacturingProducts = [
  // Windows
  {
    name: 'Casement Window',
    description: 'Energy-efficient casement window with modern design. Perfect for ventilation and natural light.',
    slug: 'casement-window',
    price: 45000, // $450 in cents
    currency: 'usd',
    product_type: 'one_time',
    status: 'active',
    metadata: {
      category: 'windows',
      material: 'vinyl',
      size: 'standard',
    },
  },
  {
    name: 'Double-Hung Window',
    description: 'Classic double-hung window design. Easy to clean and maintain with excellent energy efficiency.',
    slug: 'double-hung-window',
    price: 60000, // $600 in cents
    currency: 'usd',
    product_type: 'one_time',
    status: 'active',
    metadata: {
      category: 'windows',
      material: 'vinyl',
      size: 'standard',
    },
  },
  {
    name: 'Bay Window',
    description: 'Elegant bay window that extends outward, creating additional interior space and panoramic views.',
    slug: 'bay-window',
    price: 80000, // $800 in cents
    currency: 'usd',
    product_type: 'one_time',
    status: 'active',
    metadata: {
      category: 'windows',
      material: 'vinyl',
      size: 'large',
    },
  },
  // Doors
  {
    name: 'Interior Door',
    description: 'Solid wood interior door with modern hardware. Available in various finishes.',
    slug: 'interior-door',
    price: 25000, // $250 in cents
    currency: 'usd',
    product_type: 'one_time',
    status: 'active',
    metadata: {
      category: 'doors',
      material: 'wood',
      type: 'interior',
    },
  },
  {
    name: 'Exterior Door',
    description: 'Weather-resistant exterior door with security features. Energy efficient and durable.',
    slug: 'exterior-door',
    price: 65000, // $650 in cents
    currency: 'usd',
    product_type: 'one_time',
    status: 'active',
    metadata: {
      category: 'doors',
      material: 'steel',
      type: 'exterior',
    },
  },
  {
    name: 'Sliding Door',
    description: 'Modern sliding glass door system. Perfect for patios and outdoor access.',
    slug: 'sliding-door',
    price: 95000, // $950 in cents
    currency: 'usd',
    product_type: 'one_time',
    status: 'active',
    metadata: {
      category: 'doors',
      material: 'glass',
      type: 'sliding',
    },
  },
  // Hardware
  {
    name: 'Door Handle Set',
    description: 'Premium door handle set with matching deadbolt. Available in multiple finishes.',
    slug: 'door-handle-set',
    price: 4500, // $45 in cents
    currency: 'usd',
    product_type: 'one_time',
    status: 'active',
    metadata: {
      category: 'hardware',
      type: 'handles',
    },
  },
  {
    name: 'Lock Set',
    description: 'Complete lock set with keyed entry. High security and easy installation.',
    slug: 'lock-set',
    price: 12000, // $120 in cents
    currency: 'usd',
    product_type: 'one_time',
    status: 'active',
    metadata: {
      category: 'hardware',
      type: 'locks',
    },
  },
  {
    name: 'Hinges',
    description: 'Heavy-duty door hinges. Set of 3 pairs for standard door installation.',
    slug: 'hinges',
    price: 2500, // $25 in cents
    currency: 'usd',
    product_type: 'one_time',
    status: 'active',
    metadata: {
      category: 'hardware',
      type: 'hinges',
    },
  },
  // Custom Fabrication
  {
    name: 'Custom Window',
    description: 'Custom fabricated window to your specifications. Contact us for sizing and design options.',
    slug: 'custom-window',
    price: 50000, // Starting at $500 in cents
    currency: 'usd',
    product_type: 'service',
    status: 'active',
    metadata: {
      category: 'custom',
      type: 'window',
      priceRange: '500-2000',
    },
  },
  {
    name: 'Custom Door',
    description: 'Custom fabricated door designed to your exact requirements. Premium materials and craftsmanship.',
    slug: 'custom-door',
    price: 80000, // Starting at $800 in cents
    currency: 'usd',
    product_type: 'service',
    status: 'active',
    metadata: {
      category: 'custom',
      type: 'door',
      priceRange: '800-3000',
    },
  },
];

async function main() {
  console.log('Seeding manufacturing products...');

  for (const product of manufacturingProducts) {
    try {
      const existing = await prisma.product.findUnique({
        where: { slug: product.slug },
      });

      if (existing) {
        console.log(`Product ${product.slug} already exists, skipping...`);
        continue;
      }

      await prisma.product.create({
        data: product,
      });

      console.log(`Created product: ${product.name}`);
    } catch (error) {
      console.error(`Error creating product ${product.slug}:`, error);
    }
  }

  console.log('Finished seeding manufacturing products!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

