// Test notification endpoint - for debugging
import { notifyNewMessage } from '../../lib/messageNotificationHelper';
import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversationId, messageId } = req.body;

    if (!conversationId || !messageId) {
      return res.status(400).json({ error: 'conversationId and messageId are required' });
    }

    console.log('[TEST_NOTIFICATION] Starting test notification', {
      conversationId,
      messageId
    });

    // Fetch message and conversation
    const message = await prisma.partnerMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

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

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    console.log('[TEST_NOTIFICATION] Found conversation and message', {
      messageId: message.id,
      conversationId: conversation.id,
      senderId: message.sender_id,
      partnerNotificationsEnabled: conversation.partner?.email_notifications_enabled,
      userNotificationsEnabled: conversation.user?.profile?.email_notifications_enabled
    });

    // Call notifyNewMessage
    await notifyNewMessage({ message, conversation });

    return res.status(200).json({
      success: true,
      message: 'Notification test completed. Check server logs for details.',
      conversation: {
        id: conversation.id,
        partnerNotificationsEnabled: conversation.partner?.email_notifications_enabled,
        userNotificationsEnabled: conversation.user?.profile?.email_notifications_enabled
      }
    });
  } catch (error) {
    console.error('[TEST_NOTIFICATION] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
}

