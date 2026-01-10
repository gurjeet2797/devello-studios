#!/usr/bin/env node

/**
 * Test Script for Upload Abuse Fixes
 * Tests both server-side limit enforcement and guest user purchase tracking
 */

import { PrismaClient } from '@prisma/client';
import { UploadAllowanceService } from '../lib/uploadAllowanceService.js';
import { GuestPurchaseService } from '../lib/guestPurchaseService.js';

const prisma = new PrismaClient();

// Test data
const TEST_USER = {
  id: 'test-abuse-user',
  email: 'test-abuse@example.com',
  subscription: { plan_type: 'basic', status: 'active' }
};

async function clearTestData() {
  
  try {
    // Delete test user and related data
    await prisma.upload.deleteMany({
      where: { user_id: TEST_USER.id }
    });
    
    await prisma.oneTimePurchase.deleteMany({
      where: { user_id: TEST_USER.id }
    });
    
    await prisma.guestPurchase.deleteMany({
      where: { session_id: { startsWith: 'test-guest' } }
    });
    
    await prisma.userProfile.deleteMany({
      where: { user_id: TEST_USER.id }
    });
    
    await prisma.subscription.deleteMany({
      where: { user_id: TEST_USER.id }
    });
    
    await prisma.user.deleteMany({
      where: { id: TEST_USER.id }
    });
    
  } catch (error) {
  }
}

async function createTestUser() {
  
  try {
    // Create user
    const user = await prisma.user.create({
      data: {
        id: TEST_USER.id,
        email: TEST_USER.email,
        supabase_user_id: `test-${TEST_USER.id}`,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    // Create profile with 0 uploads remaining (at limit)
    await prisma.userProfile.create({
      data: {
        user_id: TEST_USER.id,
        upload_count: 30, // Basic plan limit is 30, so 0 remaining
        upload_limit: 30,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    // Create subscription
    await prisma.subscription.create({
      data: {
        user_id: TEST_USER.id,
        plan_type: 'basic',
        status: 'active',
        upload_limit: 30,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
  } catch (error) {
    throw error;
  }
}

async function testServerSideLimitEnforcement() {
  
  try {
    // Test 1: Check if user can upload (should be false)
    const canUpload = await UploadAllowanceService.canUpload(TEST_USER.id);
    
    if (canUpload) {
      return false;
    }
    
    // Test 2: Try to record an upload (should fail)
    try {
      await UploadAllowanceService.recordUpload(TEST_USER.id, {
        fileName: 'test-abuse.jpg',
        fileSize: 1024,
        fileType: 'image/jpeg',
        uploadType: 'test'
      });
      return false;
    } catch (error) {
      if (error.message === 'Upload limit reached') {
      } else {
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function testGuestPurchaseTracking() {
  
  const sessionId = 'test-guest-session-123';
  
  try {
    // Test 1: Create a guest purchase
    const guestPurchase = await GuestPurchaseService.createGuestPurchase(
      sessionId,
      'test-payment-intent-123',
      {
        amount: 100, // $1.00
        currency: 'usd',
        purchaseType: 'single_upload',
        uploadsGranted: 5,
        userEmail: 'guest@example.com'
      }
    );
    
    
    // Test 2: Check guest upload allowance
    const allowance = await GuestPurchaseService.canGuestUpload(sessionId);
    
    if (allowance.remaining !== 5 || allowance.source !== 'purchase') {
      return false;
    }
    
    // Test 3: Record guest uploads
    for (let i = 1; i <= 3; i++) {
      const result = await GuestPurchaseService.recordGuestUpload(sessionId, {
        fileName: `test-guest-${i}.jpg`,
        fileSize: 1024,
        fileType: 'image/jpeg',
        uploadType: 'test'
      });
      
    }
    
    // Test 4: Check final allowance
    const finalAllowance = await GuestPurchaseService.canGuestUpload(sessionId);
    
    if (finalAllowance.remaining !== 2) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function testGuestPurchaseTransfer() {
  
  const sessionId = 'test-guest-transfer-456';
  const userId = 'test-transfer-user';
  
  try {
    // Create guest purchase
    await GuestPurchaseService.createGuestPurchase(
      sessionId,
      'test-transfer-payment-123',
      {
        amount: 200,
        currency: 'usd',
        purchaseType: 'single_upload',
        uploadsGranted: 3,
        userEmail: 'transfer@example.com'
      }
    );
    
    // Create user
    await prisma.user.create({
      data: {
        id: userId,
        email: 'transfer@example.com',
        supabase_user_id: `test-${userId}`,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    // Transfer guest purchase to user
    const userPurchase = await GuestPurchaseService.transferGuestPurchaseToUser(sessionId, userId);
    
    if (!userPurchase) {
      return false;
    }
    
    
    // Verify user now has the credits
    const userAllowance = await UploadAllowanceService.getUserAllowance(userId);
    
    if (userAllowance.oneTimeCredits !== 3) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function runAllTests() {
  
  const results = {
    serverLimits: false,
    guestPurchases: false,
    guestTransfer: false
  };
  
  try {
    // Clear and setup
    await clearTestData();
    await createTestUser();
    
    // Run tests
    results.serverLimits = await testServerSideLimitEnforcement();
    results.guestPurchases = await testGuestPurchaseTracking();
    results.guestTransfer = await testGuestPurchaseTransfer();
    
    // Summary
    
    const allPassed = Object.values(results).every(result => result);
    
    if (allPassed) {
    } else {
    }
    
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
