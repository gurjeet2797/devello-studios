#!/usr/bin/env node

/**
 * Reset All User Uploads Script
 * Resets all users' upload counts to zero for a fresh start with new limits
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAllUploads() {
  try {
    
    // Get all users with profiles
    const usersWithProfiles = await prisma.user.findMany({
      include: {
        profile: true
      }
    });
    
    
    // Reset upload count for all users
    const updateResult = await prisma.userProfile.updateMany({
      data: {
        upload_count: 0
      }
    });


    // Reset any consumed one-time purchase credits
    const purchaseResetResult = await prisma.oneTimePurchase.updateMany({
      data: {
        uploads_used: 0
      }
    });

    
    // Verify the reset
    const usersAfterReset = await prisma.user.findMany({
      include: {
        profile: true
      },
      where: {
        profile: {
          upload_count: {
            gt: 0
          }
        }
      }
    });
    
    if (usersAfterReset.length === 0) {
    } else {
    }
    
    // Show some sample users
    const sampleUsers = await prisma.user.findMany({
      include: {
        profile: true
      },
      take: 5
    });
    
    sampleUsers.forEach(user => {
    });
    
  } catch (error) {
    console.error('❌ Error resetting upload counts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetAllUploads()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Upload reset failed:', error);
    process.exit(1);
  });
