const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUploadLimits() {
  try {
    
    // Update user profiles
    const updatedProfiles = await prisma.userProfile.updateMany({
      where: {
        upload_limit: 5
      },
      data: {
        upload_limit: 10
      }
    });
    
    
    // Update subscriptions
    const updatedSubscriptions = await prisma.subscription.updateMany({
      where: {
        upload_limit: 5
      },
      data: {
        upload_limit: 10
      }
    });
    
    
  } catch (error) {
    console.error('Error updating upload limits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUploadLimits();
