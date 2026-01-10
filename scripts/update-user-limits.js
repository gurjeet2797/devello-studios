// Script to update existing user upload limits
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserLimits() {
  try {
    
    // Update all user profiles to have upload_limit = 100
    const updatedProfiles = await prisma.userProfile.updateMany({
      where: {
        upload_limit: { lt: 100 } // Only update if less than 100
      },
      data: {
        upload_limit: 100
      }
    });
    
    
    // Update all subscriptions to have upload_limit = 100 for free tier
    const updatedSubscriptions = await prisma.subscription.updateMany({
      where: {
        plan_type: 'free',
        upload_limit: { lt: 100 }
      },
      data: {
        upload_limit: 100
      }
    });
    
    
    // Check specific user
    const specificUser = await prisma.user.findUnique({
      where: { supabase_user_id: '93f44bb9-4b5d-45ef-a5dd-d33d43a5596e' },
      include: {
        profile: true,
        subscription: true
      }
    });
    
    if (specificUser) {
        id: specificUser.id,
        email: specificUser.email,
        profile: {
          upload_count: specificUser.profile?.upload_count,
          upload_limit: specificUser.profile?.upload_limit
        },
        subscription: {
          plan_type: specificUser.subscription?.plan_type,
          upload_limit: specificUser.subscription?.upload_limit
        }
      });
    } else {
    }
    
  } catch (error) {
    console.error('❌ Error updating user limits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserLimits();
