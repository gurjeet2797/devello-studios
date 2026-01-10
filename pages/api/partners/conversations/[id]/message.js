import { createSupabaseAuthClient } from '../../../../../lib/supabaseClient';
import prisma from '../../../../../lib/prisma';
import { notifyNewMessage } from '../../../../../lib/messageNotificationHelper';

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

    const { id } = req.query;
    const { message, attachments } = req.body;

    if ((!message || !message.trim()) && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message or attachments are required' });
    }

    // Get conversation with full relationships for notifications
    const conversation = await prisma.conversation.findUnique({
      where: { id },
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

    // Verify partner owns this conversation
    if (conversation.partner_id !== partner.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Create reply message
    const replyMessage = await prisma.partnerMessage.create({
      data: {
        partner_id: partner.id,
        conversation_id: conversation.id,
        user_id: conversation.user_id,
        sender_name: partner.company_name,
        sender_email: supabaseUser.email || '',
        sender_id: 'partner',
        subject: `Re: ${conversation.subject}`,
        message: message ? message.trim() : '',
        attachments: attachments && attachments.length > 0 ? attachments : null,
        status: 'read' // Partner messages are auto-read
      }
    });

    // Update conversation last_message_at
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { last_message_at: new Date() }
    });

    // Mark original client messages in this conversation as replied (if any unread)
    await prisma.partnerMessage.updateMany({
      where: {
        conversation_id: id,
        sender_id: 'client',
        status: { in: ['new', 'read'] }
      },
      data: {
        status: 'replied',
        replied_at: new Date()
      }
    });

    // Send email notification to client (async, don't wait)
    notifyNewMessage({ message: replyMessage, conversation }).catch(err => {
      console.error('[PARTNER_CONVERSATION_MESSAGE_API] Failed to send notification:', err);
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      messageId: replyMessage.id
    });
  } catch (error) {
    console.error('Error sending partner message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

