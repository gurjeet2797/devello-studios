import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import prisma from '../../../lib/prisma';
import { notifyNewMessage } from '../../../lib/messageNotificationHelper';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const supabase = createSupabaseAuthClient();
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !supabaseUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { supabase_user_id: supabaseUser.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get partner record
    const partner = await prisma.partner.findUnique({
      where: { user_id: user.id },
      select: { id: true, status: true, company_name: true }
    });

    if (!partner || partner.status !== 'approved') {
      return res.status(403).json({ error: 'Partner access required' });
    }

    const { messageId, message } = req.body;

    if (!messageId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the original message with conversation
    const originalMessage = await prisma.partnerMessage.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
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
        }
      }
    });

    if (!originalMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (originalMessage.partner_id !== partner.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get or create conversation with full relationships
    let conversation = originalMessage.conversation;
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          partner_id: partner.id,
          user_id: originalMessage.user_id,
          subject: originalMessage.subject,
          status: 'active'
        },
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

      // Link original message to conversation
      await prisma.partnerMessage.update({
        where: { id: messageId },
        data: { conversation_id: conversation.id }
      });
    } else {
      // Ensure conversation has full relationships loaded
      if (!conversation.partner?.user || !conversation.user) {
        conversation = await prisma.conversation.findUnique({
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
      }
    }

    // Create reply message
    const replyMessage = await prisma.partnerMessage.create({
      data: {
        partner_id: partner.id,
        conversation_id: conversation.id,
        user_id: originalMessage.user_id,
        sender_name: partner.company_name,
        sender_email: supabaseUser.email || '',
        sender_id: 'partner',
        subject: `Re: ${originalMessage.subject}`,
        message: message,
        reply_to_id: messageId,
        status: 'read' // Partner messages are auto-read
      }
    });

    // Update conversation last_message_at
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { last_message_at: new Date() }
    });

    // Mark original message as replied
    await prisma.partnerMessage.update({
      where: { id: messageId },
      data: { 
        status: 'replied',
        replied_at: new Date()
      }
    });

    // Send email notification to client (async, don't wait)
    notifyNewMessage({ message: replyMessage, conversation }).catch(err => {
      console.error('[PARTNER_REPLY_API] Failed to send notification:', err);
    });

    return res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      messageId: replyMessage.id,
      conversationId: conversation.id
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

