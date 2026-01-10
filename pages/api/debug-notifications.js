// Debug endpoint to check notification status
import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversationId, partnerId, userId } = req.query;

    const results = {};

    // Check partner notifications if partnerId provided
    if (partnerId) {
      const partner = await prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          user: {
            include: { profile: true }
          }
        }
      });

      if (partner) {
        results.partner = {
          id: partner.id,
          companyName: partner.company_name,
          emailNotificationsEnabled: partner.email_notifications_enabled,
          userEmail: partner.user?.email,
          hasUser: !!partner.user
        };
      } else {
        results.partner = { error: 'Partner not found' };
      }
    }

    // Check user notifications if userId provided
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      });

      if (user) {
        results.user = {
          id: user.id,
          email: user.email,
          emailNotificationsEnabled: user.profile?.email_notifications_enabled || false,
          hasProfile: !!user.profile
        };
      } else {
        results.user = { error: 'User not found' };
      }
    }

    // Check conversation if conversationId provided
    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          partner: {
            include: {
              user: {
                include: { profile: true }
              }
            }
          },
          user: {
            include: { profile: true }
          }
        }
      });

      if (conversation) {
        results.conversation = {
          id: conversation.id,
          partnerId: conversation.partner_id,
          userId: conversation.user_id,
          partner: conversation.partner ? {
            id: conversation.partner.id,
            emailNotificationsEnabled: conversation.partner.email_notifications_enabled,
            userEmail: conversation.partner.user?.email
          } : null,
          user: conversation.user ? {
            id: conversation.user.id,
            emailNotificationsEnabled: conversation.user.profile?.email_notifications_enabled || false,
            email: conversation.user.email
          } : null
        };
      } else {
        results.conversation = { error: 'Conversation not found' };
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
      instructions: {
        enablePartnerNotifications: 'PUT /api/partners/notifications with { "emailNotificationsEnabled": true }',
        enableUserNotifications: 'PUT /api/user/notifications with { "emailNotificationsEnabled": true }'
      }
    });
  } catch (error) {
    console.error('[DEBUG_NOTIFICATIONS] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

