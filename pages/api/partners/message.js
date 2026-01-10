import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import prisma from '../../../lib/prisma';
import { notifyNewMessage } from '../../../lib/messageNotificationHelper';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { partnerId, senderName, senderEmail, senderPhone, subject, message } = req.body;

    // Check if user is authenticated
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const supabase = createSupabaseAuthClient();
      const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && supabaseUser) {
        user = await prisma.user.findUnique({
          where: { supabase_user_id: supabaseUser.id }
        });
      }
    }

    // Validate required fields
    if (!partnerId || !senderName || !senderEmail || !subject || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'partnerId, senderName, senderEmail, subject, and message are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Verify partner exists and is approved
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { id: true, status: true, company_name: true }
    });

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    if (partner.status !== 'approved') {
      return res.status(403).json({ error: 'Partner is not approved' });
    }


    // Create or get conversation if user is signed in
    let conversation = null;
    if (user) {
      conversation = await prisma.conversation.findFirst({
        where: {
          partner_id: partnerId,
          user_id: user.id,
          subject: subject
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

      if (!conversation) {
        const newConversation = await prisma.conversation.create({
          data: {
            id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            partner_id: partnerId,
            user_id: user.id,
            subject: subject,
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
        conversation = newConversation;
      }
    }

    // Create message
    console.log('[PARTNERS_MESSAGE] Creating message:', {
      partnerId,
      partnerIdType: typeof partnerId,
      conversationId: conversation?.id || null,
      userId: user?.id || null
    });

    const partnerMessage = await prisma.partnerMessage.create({
      data: {
        partner_id: partnerId,
        conversation_id: conversation?.id || null,
        user_id: user?.id || null,
        sender_name: senderName,
        sender_email: senderEmail,
        sender_phone: senderPhone || null,
        sender_id: 'client',
        subject,
        message,
        status: 'new'
      }
    });

    console.log('[PARTNERS_MESSAGE] Message created successfully:', {
      messageId: partnerMessage.id,
      partnerId: partnerMessage.partner_id
    });

    // Update conversation last_message_at if exists
    if (conversation) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { last_message_at: new Date() }
      });

      console.log('[PARTNERS_MESSAGE_API] Conversation exists, attempting to send notification', {
        conversationId: conversation.id,
        messageId: partnerMessage.id,
        senderId: partnerMessage.sender_id
      });

      // Send email notification to partner (async, don't wait)
      notifyNewMessage({ message: partnerMessage, conversation }).catch(err => {
        console.error('[PARTNERS_MESSAGE_API] Failed to send notification:', err);
      });
    } else {
      console.log('[PARTNERS_MESSAGE_API] No conversation exists (guest user), skipping notification', {
        messageId: partnerMessage.id,
        partnerId: partnerMessage.partner_id
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      messageId: partnerMessage.id,
      conversationId: conversation?.id || null
    });
  } catch (error) {
    console.error('Error sending partner message:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

