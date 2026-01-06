import { PrismaClient, Prisma } from '../src/generated/client';

const prisma = new PrismaClient();

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('🌱 Seeding commerce database...');

  // Create 5 dummy products for the demo tenant
  const products = [
    {
      name: 'Wireless Headphones',
      description: 'Premium wireless headphones with noise cancellation',
      price: 199.99,
      extendedAttributes: {
        category: 'Electronics',
        tags: ['audio', 'wireless', 'premium'],
        seoDescription: 'High-quality wireless headphones for music lovers',
      },
    },
    {
      name: 'Smart Watch',
      description: 'Feature-rich smartwatch with health tracking',
      price: 299.99,
      extendedAttributes: {
        category: 'Electronics',
        tags: ['wearable', 'health', 'smart'],
        seoDescription: 'Track your fitness and stay connected',
      },
    },
    {
      name: 'Laptop Stand',
      description: 'Ergonomic aluminum laptop stand for better posture',
      price: 49.99,
      extendedAttributes: {
        category: 'Accessories',
        tags: ['ergonomic', 'office', 'aluminum'],
        seoDescription: 'Improve your workspace ergonomics',
      },
    },
    {
      name: 'Mechanical Keyboard',
      description: 'RGB mechanical keyboard with Cherry MX switches',
      price: 149.99,
      extendedAttributes: {
        category: 'Electronics',
        tags: ['keyboard', 'gaming', 'rgb'],
        seoDescription: 'Professional gaming keyboard',
      },
    },
    {
      name: 'USB-C Hub',
      description: 'Multi-port USB-C hub with HDMI and SD card reader',
      price: 79.99,
      extendedAttributes: {
        category: 'Accessories',
        tags: ['usb-c', 'hub', 'connectivity'],
        seoDescription: 'Expand your laptop connectivity',
      },
    },
  ];

  // Clear existing products for demo tenant (optional - for clean seed)
  await prisma.product.deleteMany({
    where: {
      organizationId: DEMO_TENANT_ID,
    },
  });

  // Create products
  for (const productData of products) {
    const product = await prisma.product.create({
      data: {
        organizationId: DEMO_TENANT_ID,
        name: productData.name,
        description: productData.description,
        price: new Prisma.Decimal(productData.price),
        extendedAttributes: productData.extendedAttributes,
      },
    });

    console.log(`✅ Created product: ${product.name} (${product.id})`);
  }

  console.log(`\n✨ Seeded ${products.length} products for tenant: ${DEMO_TENANT_ID}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

