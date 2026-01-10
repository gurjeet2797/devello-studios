// Guest Purchase Service
// Handles one-time purchases for guest users using session-based tracking

import prisma from './prisma.js';

export class GuestPurchaseService {
  
  /**
   * Create a guest purchase record using session ID
   */
  static async createGuestPurchase(sessionId, paymentIntentId, purchaseData) {
    try {


      const purchase = await prisma.guestPurchase.create({
        data: {
          session_id: sessionId,
          stripe_payment_intent_id: paymentIntentId,
          stripe_session_id: sessionId,
          amount: purchaseData.amount || 0,
          currency: purchaseData.currency || 'usd',
          status: 'completed',
          purchase_type: purchaseData.purchaseType || 'single_upload',
          uploads_granted: purchaseData.uploadsGranted || 1,
          uploads_used: 0,
          user_email: purchaseData.userEmail || null
        }
      });

      return purchase;
    } catch (error) {
      console.error('❌ [GUEST_PURCHASE] Error creating guest purchase:', error);
      throw error;
    }
  }

  /**
   * Get guest purchase by session ID
   */
  static async getGuestPurchase(sessionId) {
    try {
      const purchase = await prisma.guestPurchase.findFirst({
        where: {
          session_id: sessionId,
          status: 'completed'
        },
        orderBy: { created_at: 'desc' }
      });

      return purchase;
    } catch (error) {
      console.error('❌ [GUEST_PURCHASE] Error getting guest purchase:', error);
      return null;
    }
  }

  /**
   * Check if guest user can upload (has remaining allowance)
   */
  static async canGuestUpload(sessionId) {
    try {
      const purchase = await this.getGuestPurchase(sessionId);
      
      if (!purchase) {
        // No purchase found, use default guest limit (3)
        return { canUpload: true, remaining: 3, limit: 3, source: 'default' };
      }

      const remaining = Math.max(0, purchase.uploads_granted - purchase.uploads_used);
      const canUpload = remaining > 0;

      console.log('Guest upload check:', {
        sessionId,
        canUpload,
        remaining,
        granted: purchase.uploads_granted,
        used: purchase.uploads_used
      });

      return {
        canUpload,
        remaining,
        limit: purchase.uploads_granted,
        source: 'purchase'
      };
    } catch (error) {
      console.error('❌ [GUEST_PURCHASE] Error checking guest upload:', error);
      return { canUpload: false, remaining: 0, limit: 0, source: 'error' };
    }
  }

  /**
   * Record a guest upload (consume allowance)
   */
  static async recordGuestUpload(sessionId, uploadData) {
    try {
      console.log('Recording guest upload:', {
        sessionId,
        uploadData
      });

      // Check if guest can upload
      const allowance = await this.canGuestUpload(sessionId);
      if (!allowance.canUpload) {
        throw new Error('Guest upload limit reached');
      }

      // If guest has a purchase, consume from it
      if (allowance.source === 'purchase') {
        const purchase = await this.getGuestPurchase(sessionId);
        if (purchase) {
          await prisma.guestPurchase.update({
            where: { id: purchase.id },
            data: {
              uploads_used: { increment: 1 }
            }
          });
        }
      }

      return { success: true, remaining: allowance.remaining - 1 };
    } catch (error) {
      console.error('❌ [GUEST_PURCHASE] Error recording guest upload:', error);
      throw error;
    }
  }

  /**
   * Transfer guest purchase to user when they sign up
   */
  static async transferGuestPurchaseToUser(sessionId, userId) {
    try {
      console.log('Transferring guest purchase to user:', {
        sessionId,
        userId
      });

      const guestPurchase = await this.getGuestPurchase(sessionId);
      if (!guestPurchase) {
        return null;
      }

      // Create user purchase record
      const userPurchase = await prisma.oneTimePurchase.create({
        data: {
          user_id: userId,
          stripe_payment_intent_id: guestPurchase.stripe_payment_intent_id,
          stripe_session_id: guestPurchase.stripe_session_id,
          amount: guestPurchase.amount,
          currency: guestPurchase.currency,
          status: guestPurchase.status,
          purchase_type: guestPurchase.purchase_type,
          uploads_granted: guestPurchase.uploads_granted,
          uploads_used: guestPurchase.uploads_used
        }
      });

      // Mark guest purchase as transferred
      await prisma.guestPurchase.update({
        where: { id: guestPurchase.id },
        data: { status: 'transferred' }
      });

      return userPurchase;
    } catch (error) {
      console.error('❌ [GUEST_PURCHASE] Error transferring guest purchase:', error);
      throw error;
    }
  }

  /**
   * Get guest upload stats for display
   */
  static async getGuestUploadStats(sessionId) {
    try {
      const allowance = await this.canGuestUpload(sessionId);
      const purchase = await this.getGuestPurchase(sessionId);

      return {
        remaining: allowance.remaining,
        limit: allowance.limit,
        used: allowance.limit - allowance.remaining,
        hasPurchase: !!purchase,
        source: allowance.source
      };
    } catch (error) {
      console.error('❌ [GUEST_PURCHASE] Error getting guest stats:', error);
      return {
        remaining: 0,
        limit: 0,
        used: 0,
        hasPurchase: false,
        source: 'error'
      };
    }
  }
}

export default GuestPurchaseService;
