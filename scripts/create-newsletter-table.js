const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createNewsletterTable() {
  try {
    
    // Create the table using raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
        "id" SERIAL NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "subscribed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "unsubscribed_at" TIMESTAMP(3),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
      );
    `;

    // Create unique index on email
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_email_key" 
      ON "newsletter_subscribers"("email");
    `;

    // Create index on status
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "newsletter_subscribers_status_idx" 
      ON "newsletter_subscribers"("status");
    `;

    // Create index on subscribed_at
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "newsletter_subscribers_subscribed_at_idx" 
      ON "newsletter_subscribers"("subscribed_at");
    `;

    
  } catch (error) {
    console.error('❌ Error creating newsletter table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createNewsletterTable()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
