import prisma from './prisma';
import { UploadAllowanceService } from './uploadAllowanceService';

export class UserService {
  // Get or create user profile
  static async getOrCreateUser(supabaseUserId, email) {
    try {
      
      let user = await prisma.user.findUnique({
        where: { supabase_user_id: supabaseUserId },
        include: {
          profile: true,
          subscription: true,
          uploads: {
            orderBy: { created_at: 'desc' },
            take: 10
          }
        }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            supabase_user_id: supabaseUserId,
            profile: {
              create: {
                upload_count: 0,
                upload_limit: 5  // Free tier limit
              }
            },
            subscription: {
              create: {
                status: 'inactive',
                plan_type: 'free',
                upload_limit: 5  // Free tier limit
              }
            }
          },
          include: {
            profile: true,
            subscription: true,
            uploads: {
              orderBy: { created_at: 'desc' },
              take: 10
            }
          }
        });
      } else {
        console.log('User found:', {
          id: user.id,
          email: user.email,
          hasProfile: !!user.profile,
          hasSubscription: !!user.subscription
        });
      }

      // Link any guest orders/payments to this user when signing in or signing up
      const reassignment = await this.reassignGuestOrders(user.id, email);
      if (reassignment?.ordersUpdated || reassignment?.paymentsUpdated) {
        console.log('🔄 [USER_SERVICE] Guest orders reassigned to user', {
          userId: user.id,
          email,
          ordersUpdated: reassignment.ordersUpdated,
          paymentsUpdated: reassignment.paymentsUpdated
        });
      }

      return user;
    } catch (error) {
      console.error('❌ [USER_SERVICE] Error getting/creating user:', {
        error: error.message,
        code: error.code,
        meta: error.meta,
        env: {
          hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          nodeEnv: process.env.NODE_ENV
        }
      });
      
      // If it's a database connection error, provide a fallback
      if (error.code === 'P1001' || error.message?.includes('connect')) {
        console.error('❌ [USER_SERVICE] Database connection failed, returning fallback user');
        return {
          id: supabaseUserId,
          email: email,
          profile: {
            upload_count: 0,
            upload_limit: 5
          },
          subscription: {
            status: 'inactive',
            plan_type: 'free'
          },
          uploads: []
        };
      }
      
      throw error;
    }
  }

  // Get user by Supabase ID
  static async getUserBySupabaseId(supabaseUserId) {
    try {
      return await prisma.user.findUnique({
        where: { supabase_user_id: supabaseUserId },
        include: {
          profile: true,
          subscription: true,
          uploads: {
            orderBy: { created_at: 'desc' },
            take: 50
          }
        }
      });
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  // Record an upload (without counting towards limit)
  static async recordUploadWithoutCount(userId, uploadData) {
    try {
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

      // Don't increment upload count - this will be done when processing completes
      return upload;
    } catch (error) {
      console.error('Error recording upload:', error);
      throw error;
    }
  }

  // Record an upload (with counting towards limit)
  static async recordUpload(userId, uploadData) {
    try {
      console.log('Recording upload:', {
        fileName: uploadData.fileName,
        fileSize: uploadData.fileSize,
        fileType: uploadData.fileType,
        uploadType: uploadData.uploadType
      });

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


      // Try to use one-time purchase credit first
      const usedOneTimeCredit = await this.useOneTimeUploadCredit(userId);
      
      if (!usedOneTimeCredit) {
        // No one-time credits available, increment base upload count
        const updatedProfile = await prisma.userProfile.update({
          where: { user_id: userId },
          data: {
            upload_count: {
              increment: 1
            }
          }
        });
        console.log('Base upload count incremented:', {
          newCount: updatedProfile.upload_count
        });
      } else {
        console.log('One-time credit used:', {
          creditUsed: usedOneTimeCredit
        });
      }

      // Get final upload stats for logging
      const finalStats = await this.getUploadStats(userId);

      return upload;
    } catch (error) {
      console.error('❌ [UPLOAD_RECORD] Error recording upload:', error);
      throw error;
    }
  }

  // Mark upload as processed and count towards limit
  static async markUploadAsProcessed(uploadId, predictionId = null) {
    try {
      const upload = await prisma.upload.update({
        where: { id: uploadId },
        data: {
          status: 'completed',
          prediction_id: predictionId
        }
      });

      // Now increment the user's upload count
      await prisma.userProfile.update({
        where: { user_id: upload.user_id },
        data: {
          upload_count: {
            increment: 1
          }
        }
      });

      return upload;
    } catch (error) {
      console.error('Error marking upload as processed:', error);
      throw error;
    }
  }

  // Check if user can upload (has remaining uploads)
  static async canUpload(userId) {
    try {

      const allowance = await UploadAllowanceService.getUserAllowance(userId);
      const canUpload = allowance.remaining > 0;

      console.log('Upload permission check:', {
        userId,
        planType: allowance.planType,
        totalLimit: allowance.totalLimit,
        used: allowance.used,
        remaining: allowance.remaining,
        oneTimeCredits: allowance.oneTimeCredits,
        breakdown: allowance.breakdown
      });

      return canUpload;
    } catch (error) {
      console.error('❌ [UPLOAD_LIMIT] Error checking upload permission:', error);
      return false;
    }
  }

  // Get user's upload stats
  static async getUploadStats(userId) {
    try {
      const stats = await UploadAllowanceService.getUploadStats(userId);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
          uploads: {
            orderBy: { created_at: 'desc' }
          }
        }
      });

      if (!user) return null;

      return {
        ...stats,
        remainingUploads: stats.remaining,
        subscription: user.subscription,
        recentUploads: user.uploads.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting upload stats:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(userId, profileData) {
    try {
      return await prisma.userProfile.update({
        where: { user_id: userId },
        data: profileData
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Update subscription
  static async updateSubscription(userId, subscriptionData) {
    try {
      return await prisma.subscription.upsert({
        where: { user_id: userId },
        update: subscriptionData,
        create: {
          user_id: userId,
          ...subscriptionData
        }
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Create one-time purchase record
  static async createOneTimePurchase(purchaseData) {
    try {
      const purchase = await prisma.oneTimePurchase.create({
        data: {
          user_id: purchaseData.userId,
          stripe_payment_intent_id: purchaseData.stripePaymentIntentId,
          stripe_session_id: purchaseData.stripeSessionId,
          amount: purchaseData.amount,
          currency: purchaseData.currency,
          status: purchaseData.status,
          purchase_type: purchaseData.purchaseType,
          uploads_granted: purchaseData.uploadsGranted
        }
      });
      return purchase;
    } catch (error) {
      console.error('Error creating one-time purchase:', error);
      throw error;
    }
  }

  // Update one-time purchase status
  static async updateOneTimePurchaseStatus(paymentIntentId, status) {
    try {
      const purchase = await prisma.oneTimePurchase.update({
        where: { stripe_payment_intent_id: paymentIntentId },
        data: { status }
      });
      return purchase;
    } catch (error) {
      console.error('Error updating one-time purchase status:', error);
      throw error;
    }
  }

  // Use one-time purchase upload credit
  static async useOneTimeUploadCredit(userId) {
    try {

      const used = await UploadAllowanceService.consumeOneTimeCredit(userId);

      if (!used) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ [ONE_TIME_CREDIT] Error using one-time upload credit:', error);
      return false;
    }
  }

  // Reassign guest orders/payments to a newly authenticated user
  static async reassignGuestOrders(userId, email) {
    if (!email) return { ordersUpdated: 0, paymentsUpdated: 0 };

    try {
      const guestOrders = await prisma.productOrder.findMany({
        where: {
          guest_email: email,
          user_id: { not: userId }
        },
        select: { id: true }
      });

      if (!guestOrders.length) {
        return { ordersUpdated: 0, paymentsUpdated: 0 };
      }

      const orderIds = guestOrders.map(order => order.id);

      const [orderResult, paymentResult] = await Promise.all([
        prisma.productOrder.updateMany({
          where: { id: { in: orderIds } },
          data: { user_id: userId }
        }),
        prisma.payment.updateMany({
          where: { product_order_id: { in: orderIds } },
          data: { user_id: userId }
        })
      ]);

      return {
        ordersUpdated: orderResult.count,
        paymentsUpdated: paymentResult.count
      };
    } catch (error) {
      console.error('⚠️ [USER_SERVICE] Failed to reassign guest orders:', {
        userId,
        email,
        error: error.message
      });
      return { ordersUpdated: 0, paymentsUpdated: 0, error: error.message };
    }
  }

  // Update user profile and related data
  static async updateUser(userId, updates) {
    try {
      
      console.log('Updating user:', {
        userId,
        updates
      });

      // Get current user data
      const user = await prisma.user.findUnique({
        where: { supabase_user_id: userId },
        include: {
          profile: true,
          subscription: true,
          uploads: {
            orderBy: { created_at: 'desc' },
            take: 10
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update profile if profile fields are provided
      if (updates.first_name || updates.last_name || updates.display_name || updates.website || updates.bio || updates.upload_limit || updates.upload_count !== undefined) {
        const profileUpdates = {};
        if (updates.first_name) profileUpdates.first_name = updates.first_name;
        if (updates.last_name) profileUpdates.last_name = updates.last_name;
        if (updates.display_name) profileUpdates.first_name = updates.display_name;
        if (updates.website) profileUpdates.website = updates.website;
        if (updates.bio) profileUpdates.company = updates.bio; // Using company field for bio
        if (updates.upload_limit) profileUpdates.upload_limit = updates.upload_limit;
        if (updates.upload_count !== undefined) profileUpdates.upload_count = updates.upload_count;

        await prisma.userProfile.update({
          where: { user_id: user.id },
          data: profileUpdates
        });
      }

      // Get updated user data
      const updatedUser = await prisma.user.findUnique({
        where: { supabase_user_id: userId },
        include: {
          profile: true,
          subscription: true,
          uploads: {
            orderBy: { created_at: 'desc' },
            take: 10
          }
        }
      });

      // Format response
      const response = {
        id: updatedUser.id,
        email: updatedUser.email,
        profile: updatedUser.profile,
        subscription: updatedUser.subscription,
        uploads: updatedUser.uploads,
        uploadStats: {
          uploadCount: updatedUser.profile.upload_count,
          uploadLimit: updatedUser.profile.upload_limit
        }
      };

      return response;
    } catch (error) {
      console.error('❌ [USER_SERVICE] Error updating user:', error);
      throw error;
    }
  }
}
