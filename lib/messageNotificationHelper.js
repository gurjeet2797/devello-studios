import { sendMessageNotification } from './emailService';
import prisma from './prisma';

/**
 * Send email notification when a new message is created
 * @param {Object} params
 * @param {Object} params.message - The PartnerMessage object
 * @param {Object} params.conversation - The Conversation object
 */
async function notifyNewMessage({ message, conversation }) {
  try {
    console.log('[MESSAGE_NOTIFICATION] Starting notification process', {
      messageId: message.id,
      conversationId: conversation.id,
      senderId: message.sender_id
    });

    // Fetch full conversation with relationships if not already included
    let fullConversation = conversation;
    if (!conversation.partner || !conversation.user) {
      console.log('[MESSAGE_NOTIFICATION] Fetching full conversation data', {
        conversationId: conversation.id,
        hasPartner: !!conversation.partner,
        hasUser: !!conversation.user
      });
      fullConversation = await prisma.conversation.findUnique({
        where: { id: conversation.id },
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

      if (!fullConversation) {
        console.log('[MESSAGE_NOTIFICATION] Conversation not found, skipping notification', {
          conversationId: conversation.id
        });
        return;
      }
      
      console.log('[MESSAGE_NOTIFICATION] Fetched conversation data', {
        conversationId: fullConversation.id,
        partnerId: fullConversation.partner?.id,
        partnerNotificationsEnabled: fullConversation.partner?.email_notifications_enabled,
        userId: fullConversation.user?.id,
        userNotificationsEnabled: fullConversation.user?.profile?.email_notifications_enabled
      });
    } else {
      console.log('[MESSAGE_NOTIFICATION] Using provided conversation data', {
        conversationId: conversation.id,
        partnerId: conversation.partner?.id,
        partnerNotificationsEnabled: conversation.partner?.email_notifications_enabled,
        userId: conversation.user?.id,
        userNotificationsEnabled: conversation.user?.profile?.email_notifications_enabled
      });
    }

    // Don't send notification if sender is viewing (status is 'read' means they sent it)
    // We only notify the recipient
    if (message.sender_id === 'client') {
      // Client sent message, notify partner
      const partner = fullConversation.partner;

      if (!partner || !partner.user) {
        console.log('[MESSAGE_NOTIFICATION] Partner or partner user not found, skipping');
        return;
      }

      // Check if partner has email notifications enabled
      if (!partner.email_notifications_enabled) {
        console.log('[MESSAGE_NOTIFICATION] Partner email notifications disabled, skipping', {
          partnerId: partner.id,
          emailNotificationsEnabled: partner.email_notifications_enabled
        });
        return;
      }

      const recipientEmail = partner.user.email;
      const recipientName = partner.company_name || partner.user.profile?.first_name || 'Partner';

      // Validate recipientEmail
      if (!recipientEmail || !/\S+@\S+\.\S+/.test(recipientEmail)) {
        console.error('[MESSAGE_NOTIFICATION] Invalid partner email, skipping notification', {
          partnerId: partner.id,
          recipientEmail,
          partnerUserId: partner.user.id
        });
        return;
      }

      console.log('[MESSAGE_NOTIFICATION] Sending notification to partner', {
        recipientEmail,
        recipientName,
        conversationId: fullConversation.id,
        partnerId: partner.id,
        note: 'This notification goes to the PARTNER email, NOT sales@develloinc.com'
      });

      const result = await sendMessageNotification({
        recipientEmail,
        recipientName,
        senderName: message.sender_name,
        senderEmail: message.sender_email,
        subject: message.subject,
        messagePreview: message.message,
        conversationLink: `/partners?conversation=${fullConversation.id}`,
        isPartner: true
      });

      if (result.success) {
        console.log('[MESSAGE_NOTIFICATION] Partner notification sent successfully', {
          messageId: result.messageId
        });
      } else {
        console.error('[MESSAGE_NOTIFICATION] Failed to send partner notification', {
          error: result.error
        });
      }
    } else if (message.sender_id === 'partner') {
      // Partner sent message, notify client
      if (!fullConversation.user_id) {
        console.log('[MESSAGE_NOTIFICATION] Guest user, skipping notification');
        return; // Guest user, no notification
      }

      const user = fullConversation.user;

      if (!user) {
        console.log('[MESSAGE_NOTIFICATION] User not found, skipping notification');
        return;
      }

      // Check if user has email notifications enabled
      if (!user.profile?.email_notifications_enabled) {
        console.log('[MESSAGE_NOTIFICATION] User email notifications disabled, skipping', {
          userId: user.id,
          emailNotificationsEnabled: user.profile?.email_notifications_enabled
        });
        return;
      }

      const recipientEmail = user.email;
      const recipientName = user.profile?.first_name || user.email?.split('@')[0] || 'User';

      // Validate recipientEmail
      if (!recipientEmail || !/\S+@\S+\.\S+/.test(recipientEmail)) {
        console.error('[MESSAGE_NOTIFICATION] Invalid user email, skipping notification', {
          userId: user.id,
          recipientEmail
        });
        return;
      }

      const partner = fullConversation.partner;

      console.log('[MESSAGE_NOTIFICATION] Sending notification to client', {
        recipientEmail,
        recipientName,
        conversationId: fullConversation.id,
        userId: user.id,
        note: 'This notification goes to the CLIENT email, NOT sales@develloinc.com'
      });

      const result = await sendMessageNotification({
        recipientEmail,
        recipientName,
        senderName: message.sender_name || partner?.company_name || 'Partner',
        senderEmail: message.sender_email,
        subject: message.subject,
        messagePreview: message.message,
        conversationLink: `/client-portal?conversation=${fullConversation.id}`,
        isPartner: false
      });

      if (result.success) {
        console.log('[MESSAGE_NOTIFICATION] Client notification sent successfully', {
          messageId: result.messageId
        });
      } else {
        console.error('[MESSAGE_NOTIFICATION] Failed to send client notification', {
          error: result.error
        });
      }
    } else {
      console.log('[MESSAGE_NOTIFICATION] Unknown sender_id, skipping', {
        senderId: message.sender_id
      });
    }
  } catch (error) {
    // Don't fail the request if email fails
    console.error('[MESSAGE_NOTIFICATION] Error sending notification:', error);
    console.error('[MESSAGE_NOTIFICATION] Error stack:', error.stack);
  }
}

export { notifyNewMessage };
export default { notifyNewMessage };

