// Centralized Upload Allowance Service
// Single source of truth for all upload limit logic

import prisma from './prisma.js';
import { isAdminEmail } from './adminAuth';

// SOURCE OF TRUTH: Upload limits
export const UPLOAD_LIMITS = {
  GUEST: 3,      // Trial users (localStorage)
  FREE: 5,     // Free tier
  BASIC: 30,    // Basic subscription
  PRO: 60       // Pro subscription
};

export class UploadAllowanceService {
  
  /**
   * Check if user can upload (has remaining allowance)
   */
  static async canUpload(userId) {
    try {
      // Check if user is admin - bypass limits for admin users
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });
      
      if (user && isAdminEmail(user.email)) {
        console.log('✅ [ALLOWANCE] Admin user detected, granting unlimited uploads:', user.email);
        return true;
      }
      
      const allowance = await this.getUserAllowance(userId);
      const canUpload = allowance.remaining > 0;
      
      console.log('Upload permission check:', {
        userId,
        canUpload,
        allowance
      });
      
      return canUpload;
    } catch (error) {
      console.error('❌ [ALLOWANCE] Error checking upload permission:', error);
      return false;
    }
  }

  /**
   * Check if monthly reset is needed and perform it
   */
  static async checkAndPerformMonthlyReset(userId, user) {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Get last reset date from profile
      const lastResetDate = user.profile?.last_monthly_reset;
      let needsReset = false;
      
      if (!lastResetDate) {
        // First time - set reset date but don't reset counts yet
        needsReset = false;
      } else {
        const lastReset = new Date(lastResetDate);
        const lastResetMonth = lastReset.getMonth();
        const lastResetYear = lastReset.getFullYear();
        
        // Check if we're in a different month/year
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
   * Get complete user allowance breakdown
   */
  static async getUserAllowance(userId) {
    try {
      
      let user = null;
      let purchasesUnavailable = false;

      try {
        user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            profile: true,
            subscription: true,
            one_time_purchases: {
              orderBy: { created_at: 'desc' }
            }
          }
        });
      } catch (error) {
        const prismaCode = error?.code;

        if (prismaCode === 'P2021' || prismaCode === 'P2010' || prismaCode === 'P2003' || prismaCode === 'P2022') {
          console.warn('⚠️ [ALLOWANCE] One-time purchase relation unavailable, falling back without purchases:', {
            userId,
            code: prismaCode,
            message: error.message
          });

          purchasesUnavailable = true;

          user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
              profile: true,
              subscription: true
            }
          });
        } else {
          console.error('❌ [ALLOWANCE] Database error:', {
            userId,
            code: prismaCode,
            message: error.message,
            stack: error.stack
          });
          throw error;
        }
      }

      if (!user) {
        return this.buildFallbackAllowance(userId);
      }
      
      // Check if user is admin - return unlimited allowance for admin users
      if (isAdminEmail(user.email)) {
        console.log('✅ [ALLOWANCE] Admin user detected, granting unlimited allowance:', user.email);
        return {
          totalLimit: Infinity,
          baseLimit: Infinity,
          creditsLimit: 0,
          totalUsed: user.profile?.upload_count || 0,
          baseUsed: user.profile?.upload_count || 0,
          creditsUsed: 0,
          remaining: Infinity,
          planType: 'admin',
          subscriptionStatus: 'active',
          oneTimeCredits: 0,
          totalCreditsGranted: 0,
          creditsUsed: 0,
          availableCredits: 0,
          breakdown: {
            base: { limit: Infinity, used: user.profile?.upload_count || 0, remaining: Infinity },
            credits: { granted: 0, used: 0, available: 0 },
            total: { limit: Infinity, used: user.profile?.upload_count || 0, remaining: Infinity }
          }
        };
      }
      
      // Check and perform monthly reset if needed
      await this.checkAndPerformMonthlyReset(userId, user);
      
      // Refetch user data after potential reset
      if (user.profile?.last_monthly_reset) {
        user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            profile: true,
            subscription: true,
            one_time_purchases: {
              orderBy: { created_at: 'desc' }
            }
          }
        });
      }
      
      console.log('User data retrieved:', {
        id: user.id,
        email: user.email,
        hasProfile: !!user.profile,
        hasSubscription: !!user.subscription
      });

      const subscriptionStatus = user.subscription?.status || 'inactive';
      const planType = user.subscription?.plan_type || 'free';
      
      // Priority: For free users, always use calculated limits. For paid users, use database values.
      let baseLimit;
      
      // Calculate the correct limit based on plan type and status
      if (subscriptionStatus === 'past_due') {
        // Past due users get 0 uploads until payment is resolved
        baseLimit = 0;
      } else if (planType === 'basic') {
        baseLimit = UPLOAD_LIMITS.BASIC; // 30 total
      } else if (planType === 'pro') {
        baseLimit = UPLOAD_LIMITS.PRO; // 60 total
      } else {
        baseLimit = UPLOAD_LIMITS.FREE; // Just free tier (5)
      }
      
      // For free users, always use calculated limit (5) to override incorrect database values
      if (planType === 'free') {
        // Use calculated limit for free users
      }
      // For paid users (including canceled subscriptions that still have access), use database values if they're reasonable
      else if (user.profile?.upload_limit && user.profile.upload_limit > 0 && user.profile.upload_limit <= 1000) {
        baseLimit = user.profile.upload_limit;
      }
      else if (user.subscription?.upload_limit && user.subscription.upload_limit > 0 && user.subscription.upload_limit <= 1000) {
        baseLimit = user.subscription.upload_limit;
      }
      

      const baseUsed = user.profile?.upload_count || 0;

      const allPurchases = purchasesUnavailable
        ? []
        : (user.one_time_purchases || []);
      const completedPurchases = allPurchases.filter(
        (purchase) => purchase.status === 'completed'
      );

      const totalCreditsGranted = completedPurchases.reduce(
        (total, purchase) => total + (purchase.uploads_granted || 0),
        0
      );

      const creditsUsed = completedPurchases.reduce(
        (total, purchase) =>
          total + Math.min(purchase.uploads_used || 0, purchase.uploads_granted || 0),
        0
      );

      const availableCredits = Math.max(0, totalCreditsGranted - creditsUsed);

      const totalLimit = baseLimit + totalCreditsGranted;
      const totalUsed = baseUsed + creditsUsed;
      
      // For paid plans, add 5 to remaining to account for free tier uploads
      // Only add 5 if user hasn't exceeded their base limit
      let remaining = Math.max(0, totalLimit - totalUsed);
      if (planType !== 'free' && planType !== 'guest' && baseUsed <= baseLimit) {
        remaining = remaining + 5;
      }

      // Display logic: show baseLimit as the limit, but remaining includes credits
      const displayLimit = baseLimit;

      const sortedPurchases = [...allPurchases].sort((a, b) => {
        const aTime = a.created_at
          ? new Date(a.created_at).getTime()
          : 0;
        const bTime = b.created_at
          ? new Date(b.created_at).getTime()
          : 0;
        return bTime - aTime;
      });

      const purchases = sortedPurchases.map((purchase) => {
        const remainingUploads = Math.max(
          0,
          (purchase.uploads_granted || 0) - (purchase.uploads_used || 0)
        );

        const createdAt = purchase.created_at
          ? new Date(purchase.created_at).toISOString()
          : null;
        const updatedAt = purchase.updated_at
          ? new Date(purchase.updated_at).toISOString()
          : null;

        return {
          id: purchase.id,
          amount: purchase.amount,
          currency: purchase.currency,
          status: purchase.status,
          purchaseType: purchase.purchase_type,
          uploadsGranted: purchase.uploads_granted,
          uploadsUsed: purchase.uploads_used,
          remainingUploads,
          createdAt,
          updatedAt,
          stripePaymentIntentId: purchase.stripe_payment_intent_id,
          stripeSessionId: purchase.stripe_session_id
        };
      });

      const allowance = {
        userId,
        planType,
        subscriptionStatus,
        baseLimit,
        baseUsed,
        totalCreditsGranted,
        creditsUsed,
        oneTimeCredits: availableCredits,
        totalLimit: displayLimit,
        used: totalUsed,
        remaining: remaining,
        breakdown: {
          base: baseLimit,
          credits: availableCredits,
          total: totalLimit,
          used: totalUsed,
          remaining
        },
        creditSummary: {
          base: {
            limit: baseLimit,
            used: baseUsed,
            remaining: Math.max(0, baseLimit - baseUsed)
          },
          credits: {
            granted: totalCreditsGranted,
            used: creditsUsed,
            available: availableCredits
          }
        },
        purchases
      };

      return allowance;
    } catch (error) {
      console.error('❌ [ALLOWANCE] Error calculating user allowance:', error);
      throw error;
    }
  }

  /**
   * Record an upload and consume allowance
   */
  static async recordUpload(userId, uploadData) {
    try {

      // Check permission first
      const canUpload = await this.canUpload(userId);
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


      // Consume allowance (try one-time credits first)
      const creditUsed = await this.consumeAllowance(userId);
      
      // Get updated allowance
      const updatedAllowance = await this.getUserAllowance(userId);
      
      console.log('Upload recorded successfully:', {
        uploadId: upload.id,
        creditUsed,
        updatedAllowance
      });

      return {
        upload,
        allowance: updatedAllowance
      };
    } catch (error) {
      console.error('❌ [ALLOWANCE] Error recording upload:', error);
      throw error;
    }
  }

  /**
   * Consume one unit of allowance (one-time credits first, then base)
   */
  static async consumeAllowance(userId) {
    try {

      // Try to use one-time credit first
      const creditUsed = await this.consumeOneTimeCredit(userId);
      
      if (creditUsed) {
        return { type: 'credit', used: true };
      }

      // No credits available, use base allowance
      const updatedProfile = await prisma.userProfile.update({
        where: { user_id: userId },
        data: {
          upload_count: {
            increment: 1
          }
        }
      });

      console.log('Base allowance consumed:', {
        newCount: updatedProfile.upload_count
      });

      return { type: 'base', used: true };
    } catch (error) {
      console.error('❌ [ALLOWANCE] Error consuming allowance:', error);
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

      console.log('Using one-time credit:', {
        purchaseId: availablePurchase.id,
        granted: availablePurchase.uploads_granted,
        used: availablePurchase.uploads_used
      });

      const updatedPurchase = await prisma.oneTimePurchase.update({
        where: { id: availablePurchase.id },
        data: { uploads_used: { increment: 1 } }
      });

      console.log('One-time credit consumed:', {
        purchaseId: availablePurchase.id,
        newUsedCount: updatedPurchase.uploads_used,
        remaining: updatedPurchase.uploads_granted - updatedPurchase.uploads_used
      });

      return true;
    } catch (error) {
      console.error('❌ [ALLOWANCE] Error using one-time credit:', error);
      return false;
    }
  }

  /**
   * Add one-time purchase credits
   */
  static async addOneTimeCredits(userId, credits, purchaseData) {
    try {
      console.log('Adding one-time credits:', {
        userId,
        credits,
        purchaseData
      });

      const existingPurchase = await prisma.oneTimePurchase.findUnique({
        where: {
          stripe_payment_intent_id: purchaseData.paymentIntentId
        }
      });

      if (existingPurchase) {
        const updatedPurchase = await prisma.oneTimePurchase.update({
          where: {
            stripe_payment_intent_id: purchaseData.paymentIntentId
          },
          data: {
            status: 'completed',
            amount: purchaseData.amount ?? existingPurchase.amount,
            currency: purchaseData.currency ?? existingPurchase.currency,
            purchase_type:
              purchaseData.purchaseType || existingPurchase.purchase_type,
            uploads_granted: credits,
            stripe_session_id: purchaseData.sessionId || existingPurchase.stripe_session_id
          }
        });

        console.log('Updated existing purchase:', {
          purchaseId: updatedPurchase.id,
          credits
        });

        return updatedPurchase;
      }

      const purchase = await prisma.oneTimePurchase.create({
        data: {
          user_id: userId,
          stripe_payment_intent_id: purchaseData.paymentIntentId,
          stripe_session_id: purchaseData.sessionId,
          amount: purchaseData.amount ?? 0,
          currency: purchaseData.currency || 'usd',
          status: purchaseData.status || 'completed',
          purchase_type: purchaseData.purchaseType || 'single_upload',
          uploads_granted: credits,
          uploads_used: purchaseData.uploadsUsed ?? 0
        }
      });

      console.log('Created new purchase:', {
        purchaseId: purchase.id,
        credits
      });

      return purchase;
    } catch (error) {
      console.error('❌ [ALLOWANCE] Error adding one-time credits:', error);
      throw error;
    }
  }

  /**
   * Get upload statistics for display
   */
  static async getUploadStats(userId) {
    try {
      const allowance = await this.getUserAllowance(userId);
      
      // 🔍 DEBUG: Upload stats calculation
      console.log('🔍 [UPLOAD_ALLOWANCE_DEBUG] getUploadStats calculation:', {
        userId,
        allowance: {
          used: allowance.used,
          totalLimit: allowance.totalLimit,
          remaining: allowance.remaining,
          planType: allowance.planType,
          subscriptionStatus: allowance.subscriptionStatus,
          baseLimit: allowance.baseLimit,
          baseUsed: allowance.baseUsed,
          oneTimeCredits: allowance.oneTimeCredits,
          totalCreditsGranted: allowance.totalCreditsGranted,
          creditsUsed: allowance.creditsUsed
        }
      });

      return {
        uploadCount: allowance.used,
        uploadLimit: allowance.totalLimit,
        remaining: allowance.remaining,
        planType: allowance.planType,
        subscriptionStatus: allowance.subscriptionStatus,
        baseLimit: allowance.baseLimit,
        baseUsed: allowance.baseUsed,
        oneTimeCredits: allowance.oneTimeCredits,
        totalCreditsGranted: allowance.totalCreditsGranted,
        creditsUsed: allowance.creditsUsed,
        breakdown: allowance.breakdown,
        creditSummary: allowance.creditSummary,
        purchases: allowance.purchases
      };
    } catch (error) {
      console.error('❌ [ALLOWANCE] Error getting upload stats:', error);
      throw error;
    }
  }

  /**
   * Reset user upload count (for testing/admin)
   */
  static async resetUploadCount(userId) {
    try {

      const profile = await prisma.userProfile.update({
        where: { user_id: userId },
        data: { upload_count: 0 }
      });

      const purchaseReset = await prisma.oneTimePurchase.updateMany({
        where: { user_id: userId },
        data: { uploads_used: 0 }
      });

      console.log('Upload count reset:', {
        uploadCount: profile.upload_count,
        purchasesReset: purchaseReset.count
      });

      return {
        uploadCount: profile.upload_count,
        purchasesReset: purchaseReset.count
      };
    } catch (error) {
      console.error('❌ [ALLOWANCE] Error resetting upload count:', error);
      throw error;
    }
  }

  /**
   * Reset upload allowances for all users
   */
  static async resetAllAllowances() {
    try {

      const [profileResult, purchaseResult] = await Promise.all([
        prisma.userProfile.updateMany({
          data: { upload_count: 0 }
        }),
        prisma.oneTimePurchase.updateMany({
          data: { uploads_used: 0 }
        })
      ]);

      console.log('All allowances reset:', {
        profilesReset: profileResult.count,
        purchasesReset: purchaseResult.count
      });

      return {
        profilesReset: profileResult.count,
        purchasesReset: purchaseResult.count
      };
    } catch (error) {
      console.error('❌ [ALLOWANCE] Error resetting all allowances:', error);
      throw error;
    }
  }

  static buildFallbackAllowance(userId) {
    const baseLimit = UPLOAD_LIMITS.FREE;

    return {
      userId,
      planType: 'free',
      subscriptionStatus: 'inactive',
      baseLimit,
      baseUsed: 0,
      totalCreditsGranted: 0,
      creditsUsed: 0,
      oneTimeCredits: 0,
      totalLimit: baseLimit,
      used: 0,
      remaining: baseLimit,
      breakdown: {
        base: baseLimit,
        credits: 0,
        total: baseLimit,
        used: 0,
        remaining: baseLimit
      },
      creditSummary: {
        base: {
          limit: baseLimit,
          used: 0,
          remaining: baseLimit
        },
        credits: {
          granted: 0,
          used: 0,
          available: 0
        }
      },
      purchases: []
    };
  }
}

export default UploadAllowanceService;
