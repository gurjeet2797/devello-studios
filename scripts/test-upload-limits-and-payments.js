#!/usr/bin/env node

/**
 * Comprehensive Test Script for Upload Limits and Payment System
 * Tests guest limits, free user limits, payment flow, and subscription upgrades
 */

import { PrismaClient } from '@prisma/client';
import { UploadAllowanceService } from '../lib/uploadAllowanceService.js';
import { getRemainingUploads, getUploadLimit, canUpload, recordUpload } from '../lib/uploadLimits.js';

const prisma = new PrismaClient();

// Test data
const TEST_USERS = {
  guest: null, // No user object for guest
  free: {
    id: 'test-free-user',
    email: 'test-free@example.com',
    subscription: { plan_type: 'free', status: 'active' }
  },
  basic: {
    id: 'test-basic-user', 
    email: 'test-basic@example.com',
    subscription: { plan_type: 'basic', status: 'active' }
  },
  pro: {
    id: 'test-pro-user',
    email: 'test-pro@example.com', 
    subscription: { plan_type: 'pro', status: 'active' }
  }
};

async function clearAllData() {
  
  try {
    // Delete all test users and related data
    await prisma.upload.deleteMany({
      where: {
        user_id: {
          in: Object.values(TEST_USERS).filter(u => u).map(u => u.id)
        }
      }
    });
    
    await prisma.oneTimePurchase.deleteMany({
      where: {
        user_id: {
          in: Object.values(TEST_USERS).filter(u => u).map(u => u.id)
        }
      }
    });
    
    await prisma.userProfile.deleteMany({
      where: {
        user_id: {
          in: Object.values(TEST_USERS).filter(u => u).map(u => u.id)
        }
      }
    });
    
    await prisma.subscription.deleteMany({
      where: {
        user_id: {
          in: Object.values(TEST_USERS).filter(u => u).map(u => u.id)
        }
      }
    });
    
    await prisma.user.deleteMany({
      where: {
        id: {
          in: Object.values(TEST_USERS).filter(u => u).map(u => u.id)
        }
      }
    });
    
  } catch (error) {
  }
}

async function createTestUsers() {
  
  for (const [planType, userData] of Object.entries(TEST_USERS)) {
    if (!userData) continue; // Skip guest user
    
    try {
      // Create user
      const user = await prisma.user.create({
        data: {
          id: userData.id,
          email: userData.email,
          supabase_user_id: `test-${userData.id}`,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      
      // Create profile
      await prisma.userProfile.create({
        data: {
          user_id: userData.id,
          upload_count: 0,
          upload_limit: planType === 'free' ? 10 : planType === 'basic' ? 50 : 100,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      
      // Create subscription
      await prisma.subscription.create({
        data: {
          user_id: userData.id,
          plan_type: userData.subscription.plan_type,
          status: userData.subscription.status,
          upload_limit: planType === 'free' ? 10 : planType === 'basic' ? 50 : 100,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      
    } catch (error) {
    }
  }
}

async function testGuestLimits() {
  
  // Simulate guest user uploads using localStorage logic
  const guestUploads = [];
  
  for (let i = 1; i <= 5; i++) {
    const canUploadResult = canUpload(null); // null = guest user
    const remaining = getRemainingUploads(null);
    const limit = getUploadLimit(null);
    
    
    if (canUploadResult) {
      recordUpload(null); // Record the upload
      guestUploads.push(i);
    } else {
      break;
    }
  }
  
  const finalRemaining = getRemainingUploads(null);
  
  if (finalRemaining === 0 && guestUploads.length === 3) {
  } else {
  }
}

async function testFreeUserLimits() {
  
  const freeUser = TEST_USERS.free;
  
  try {
    // Test server-side allowance service
    const allowance = await UploadAllowanceService.getUserAllowance(freeUser.id);
    
    // Test multiple uploads
    for (let i = 1; i <= 12; i++) {
      const canUploadResult = await UploadAllowanceService.canUpload(freeUser.id);
      const allowanceCheck = await UploadAllowanceService.getUserAllowance(freeUser.id);
      
      
      if (canUploadResult) {
        await UploadAllowanceService.recordUpload(freeUser.id, {
          fileName: `test-${i}.jpg`,
          fileSize: 1024,
          fileType: 'image/jpeg',
          uploadType: 'test'
        });
      } else {
        break;
      }
    }
    
    const finalAllowance = await UploadAllowanceService.getUserAllowance(freeUser.id);
    
    if (finalAllowance.remaining === 0 && finalAllowance.used === 10) {
    } else {
    }
    
  } catch (error) {
  }
}

async function testBasicUserLimits() {
  
  const basicUser = TEST_USERS.basic;
  
  try {
    const allowance = await UploadAllowanceService.getUserAllowance(basicUser.id);
    
    // Test a few uploads to verify it works
    for (let i = 1; i <= 3; i++) {
      const canUploadResult = await UploadAllowanceService.canUpload(basicUser.id);
      
      if (canUploadResult) {
        await UploadAllowanceService.recordUpload(basicUser.id, {
          fileName: `test-basic-${i}.jpg`,
          fileSize: 1024,
          fileType: 'image/jpeg',
          uploadType: 'test'
        });
      }
    }
    
    const finalAllowance = await UploadAllowanceService.getUserAllowance(basicUser.id);
    
  } catch (error) {
  }
}

async function testProUserLimits() {
  
  const proUser = TEST_USERS.pro;
  
  try {
    const allowance = await UploadAllowanceService.getUserAllowance(proUser.id);
    
    // Test a few uploads to verify it works
    for (let i = 1; i <= 3; i++) {
      const canUploadResult = await UploadAllowanceService.canUpload(proUser.id);
      
      if (canUploadResult) {
        await UploadAllowanceService.recordUpload(proUser.id, {
          fileName: `test-pro-${i}.jpg`,
          fileSize: 1024,
          fileType: 'image/jpeg',
          uploadType: 'test'
        });
      }
    }
    
    const finalAllowance = await UploadAllowanceService.getUserAllowance(proUser.id);
    
  } catch (error) {
  }
}

async function testOneTimePurchase() {
  
  const freeUser = TEST_USERS.free;
  
  try {
    // Add one-time purchase credits
    const purchase = await UploadAllowanceService.addOneTimeCredits(freeUser.id, 5, {
      paymentIntentId: 'test-payment-intent-123',
      sessionId: 'test-session-123',
      amount: 500, // $5.00
      currency: 'usd',
      status: 'completed',
      purchaseType: 'single_upload'
    });
    
    
    // Check allowance with credits
    const allowance = await UploadAllowanceService.getUserAllowance(freeUser.id);
    
    // Test using credits
    for (let i = 1; i <= 3; i++) {
      const canUploadResult = await UploadAllowanceService.canUpload(freeUser.id);
      
      if (canUploadResult) {
        await UploadAllowanceService.recordUpload(freeUser.id, {
          fileName: `test-credit-${i}.jpg`,
          fileSize: 1024,
          fileType: 'image/jpeg',
          uploadType: 'test'
        });
      }
    }
    
    const finalAllowance = await UploadAllowanceService.getUserAllowance(freeUser.id);
    
  } catch (error) {
  }
}

async function testUploadLimitMessages() {
  
  // Test guest user messages
  const guestRemaining = getRemainingUploads(null);
  const guestLimit = getUploadLimit(null);
  
  // Test free user messages (simulate via client-side logic)
  const freeUser = TEST_USERS.free;
  const freeRemaining = getRemainingUploads(freeUser);
  const freeLimit = getUploadLimit(freeUser);
  
}

async function runAllTests() {
  
  try {
    // Clear existing data
    await clearAllData();
    
    // Create test users
    await createTestUsers();
    
    // Run all tests
    await testGuestLimits();
    await testFreeUserLimits();
    await testBasicUserLimits();
    await testProUserLimits();
    await testOneTimePurchase();
    await testUploadLimitMessages();
    
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
runAllTests()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
