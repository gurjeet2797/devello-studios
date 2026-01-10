// Unified Upload Service - Phase 1 Implementation
// Single source of truth for all upload limit logic
// Replaces: uploadLimits.js, uploadAllowanceService.js, userService upload methods

import prisma from './prisma.js';

// SOURCE OF TRUTH: Upload limits (consolidated from all sources)
export const UPLOAD_LIMITS = {
  GUEST: 3,      // Trial users
  FREE: 5,     // Free tier
  BASIC: 30,    // Basic subscription
  PRO: 60       // Pro subscription
};

export class UploadService {
  
  /**
   * Get complete user upload status (replaces all other methods)
   * Handles: guest users, signed-in users, monthly resets, past due status
   */
  static async getUserUploadStatus(userId = null, sessionId = null) {
    try {
      // Handle guest users
      if (!userId) {
        return await this.getGuestUploadStatus(sessionId);
      }

      // Handle signed-in users
      return await this.getSignedInUserStatus(userId);
      
    } catch (error) {
      console.error('❌ [UPLOAD_SERVICE] Error getting upload status:', error);
      return this.getFallbackStatus(userId);
    }
  }

  /**
   * Check if user can upload (unified method)
   */
  static async canUpload(userId = null, sessionId = null) {
    const status = await this.getUserUploadStatus(userId, sessionId);
    return status.remaining > 0;
  }

  /**
   * Record an upload (unified method)
   */
  static async recordUpload(userId, uploadData, sessionId = null) {
    try {
      // Check permission first
      const canUpload = await this.canUpload(userId, sessionId);
      if (!canUpload) {
        throw new Error('Upload limit reached');
      }

      // Create upload record
      const upload = await prisma.upload.create({
        data: {
          user_id: userId,
          file_name: uploadData.fileName,
          file_size: uploadData.fileSize,
          file_type: uploadData.fileType,
          upload_type: uploadData.uploadType,
          status: 'uploaded'
        }
      });

      // Consume allowance
      await this.consumeAllowance(userId, sessionId);
      
      // Get updated status
      const updatedStatus = await this.getUserUploadStatus(userId, sessionId);
      
      return {
        upload,
        status: updatedStatus
      };
    } catch (error) {
      console.error('❌ [UPLOAD_SERVICE] Error recording upload:', error);
      throw error;
    }
  }

  /**
   * Get guest user upload status
   */
  static async getGuestUploadStatus(sessionId = null) {
    // Try to get from server first
    if (sessionId) {
      try {
        const response = await fetch('/api/guest/upload-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
        
        if (response.ok) {
          const stats = await response.json();
          return {
            userType: 'guest',
            remaining: stats.remaining,
            limit: UPLOAD_LIMITS.GUEST,
            used: UPLOAD_LIMITS.GUEST - stats.remaining,
            planType: 'guest',
            subscriptionStatus: 'none'
          };
        }
      } catch (error) {
        console.warn('Failed to get guest upload stats from server:', error);
      }
    }
    
    // Fallback to localStorage
    const used = this.getGuestUploadCountFromStorage();
    const remaining = Math.max(0, UPLOAD_LIMITS.GUEST - used);
    
    return {
      userType: 'guest',
      remaining,
      limit: UPLOAD_LIMITS.GUEST,
      used,
      planType: 'guest',
      subscriptionStatus: 'none'
    };
  }

  /**
   * Get signed-in user upload status
   */
  static async getSignedInUserStatus(userId) {
    try {
      let user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          subscription: true,
          one_time_purchases: {
            where: { status: 'completed' },
            orderBy: { created_at: 'desc' }
          }
        }
      });

      if (!user) {
        return this.getFallbackStatus(userId);
      }

      // Check and perform monthly reset if needed
      await this.checkAndPerformMonthlyReset(userId, user);
      
      // Refetch user data after potential reset
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          subscription: true,
          one_time_purchases: {
            where: { status: 'completed' },
            orderBy: { created_at: 'desc' }
          }
        }
      });

      const subscriptionStatus = user.subscription?.status || 'inactive';
      const planType = user.subscription?.plan_type || 'free';
      
      // Calculate base limit based on plan and status
      let baseLimit;
      if (subscriptionStatus === 'past_due') {
        baseLimit = 0; // Past due users get 0 uploads
      } else if (planType === 'basic') {
        baseLimit = UPLOAD_LIMITS.BASIC;
      } else if (planType === 'pro') {
        baseLimit = UPLOAD_LIMITS.PRO;
      } else {
        baseLimit = UPLOAD_LIMITS.FREE;
      }

      const baseUsed = user.profile?.upload_count || 0;
      
      // Calculate one-time credits
      const totalCreditsGranted = user.one_time_purchases?.reduce(
        (total, purchase) => total + (purchase.uploads_granted || 0), 0
      ) || 0;
      
      const creditsUsed = user.one_time_purchases?.reduce(
        (total, purchase) => total + (purchase.uploads_used || 0), 0
      ) || 0;
      
      const availableCredits = Math.max(0, totalCreditsGranted - creditsUsed);
      const totalLimit = baseLimit + totalCreditsGranted;
      const totalUsed = baseUsed + creditsUsed;
      const remaining = Math.max(0, totalLimit - totalUsed);

      return {
        userType: 'signed-in',
        userId,
        planType,
        subscriptionStatus,
        baseLimit,
        baseUsed,
        totalCreditsGranted,
        creditsUsed,
        oneTimeCredits: availableCredits,
        totalLimit,
        used: totalUsed,
        remaining,
        breakdown: {
          base: baseLimit,
          credits: availableCredits,
          total: totalLimit,
          used: totalUsed,
          remaining
        }
      };

    } catch (error) {
      console.error('❌ [UPLOAD_SERVICE] Error getting signed-in user status:', error);
      return this.getFallbackStatus(userId);
    }
  }

  /**
   * Check and perform monthly reset if needed
   */
  static async checkAndPerformMonthlyReset(userId, user) {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const lastResetDate = user.profile?.last_monthly_reset;
      let needsReset = false;
      
      if (!lastResetDate) {
        // First time - set reset date but don't reset counts yet
        needsReset = false;
      } else {
        const lastReset = new Date(lastResetDate);
        const lastResetMonth = lastReset.getMonth();
        const lastResetYear = lastReset.getFullYear();
        
        needsReset = (currentMonth !== lastResetMonth) || (currentYear !== lastResetYear);
      }
      
      if (needsReset) {
        console.log('🔄 [MONTHLY_RESET] Performing monthly reset for user:', userId);
        
        // Reset upload counts
        await prisma.userProfile.update({
          where: { user_id: userId },
          data: { 
            upload_count: 0,
            last_monthly_reset: now
          }
        });
        
        // Reset one-time purchase credits (they don't carry over to next month)
        await prisma.oneTimePurchase.updateMany({
          where: { user_id: userId },
          data: { 
            uploads_granted: 0,
            uploads_used: 0
          }
        });
        
        console.log('✅ [MONTHLY_RESET] Monthly reset completed for user:', userId);
        return true;
      } else if (!lastResetDate) {
        // Set initial reset date
        await prisma.userProfile.update({
          where: { user_id: userId },
          data: { last_monthly_reset: now }
        });
      }
      
      return false;
    } catch (error) {
      console.error('❌ [MONTHLY_RESET] Error performing monthly reset:', error);
      return false;
    }
  }

  /**
   * Consume one unit of allowance
   */
  static async consumeAllowance(userId, sessionId = null) {
    if (!userId) {
      // Guest user - increment localStorage
      return this.incrementGuestUploadsInStorage();
    }

    try {
      // Try to use one-time credit first
      const creditUsed = await this.consumeOneTimeCredit(userId);
      
      if (creditUsed) {
        return { type: 'credit', used: true };
      }

      // No credits available, use base allowance
      await prisma.userProfile.update({
        where: { user_id: userId },
        data: {
          upload_count: { increment: 1 }
        }
      });

      return { type: 'base', used: true };
    } catch (error) {
      console.error('❌ [UPLOAD_SERVICE] Error consuming allowance:', error);
      throw error;
    }
  }

  /**
   * Use one-time purchase credit
   */
  static async consumeOneTimeCredit(userId) {
    try {
      const potentialPurchases = await prisma.oneTimePurchase.findMany({
        where: {
          user_id: userId,
          status: 'completed'
        },
        orderBy: { created_at: 'asc' }
      });

      const availablePurchase = potentialPurchases.find(
        (purchase) => (purchase.uploads_used || 0) < (purchase.uploads_granted || 0)
      );

      if (!availablePurchase) {
        return false;
      }

      await prisma.oneTimePurchase.update({
        where: { id: availablePurchase.id },
        data: { uploads_used: { increment: 1 } }
      });

      return true;
    } catch (error) {
      console.error('❌ [UPLOAD_SERVICE] Error using one-time credit:', error);
      return false;
    }
  }

  /**
   * Get guest upload count from localStorage
   */
  static getGuestUploadCountFromStorage() {
    if (typeof window === 'undefined') return 0;
    
    const uploads = localStorage.getItem('devello_guest_uploads');
    return uploads ? parseInt(uploads, 10) : 0;
  }

  /**
   * Increment guest uploads in localStorage
   */
  static incrementGuestUploadsInStorage() {
    if (typeof window === 'undefined') return 0;
    
    const current = this.getGuestUploadCountFromStorage();
    const newCount = current + 1;
    localStorage.setItem('devello_guest_uploads', newCount.toString());
    return newCount;
  }

  /**
   * Fallback status for errors
   */
  static getFallbackStatus(userId) {
    return {
      userType: userId ? 'signed-in' : 'guest',
      userId,
      remaining: 0,
      limit: userId ? UPLOAD_LIMITS.FREE : UPLOAD_LIMITS.GUEST,
      used: 0,
      planType: 'free',
      subscriptionStatus: 'inactive',
      error: true
    };
  }
}

export default UploadService;
