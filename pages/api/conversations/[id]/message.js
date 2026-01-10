import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import prisma from '../../../../lib/prisma';
import { notifyNewMessage } from '../../../../lib/messageNotificationHelper';

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
      where: { supabase_user_id: supabaseUser.id },
      include: { profile: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { id } = req.query;
    const { message, attachments } = req.body;

    if (!message && (!attachments || attachments.length === 0)) {
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

    // Verify user owns this conversation
    if (conversation.user_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get sender name from profile
    const senderName = user.profile?.first_name 
      ? `${user.profile.first_name}${user.profile.last_name ? ' ' + user.profile.last_name : ''}`
      : supabaseUser.email?.split('@')[0] || 'Client';

    // Create message
    const newMessage = await prisma.partnerMessage.create({
      data: {
        partner_id: conversation.partner_id,
        conversation_id: conversation.id,
        user_id: user.id,
        sender_name: senderName,
        sender_email: supabaseUser.email || '',
        sender_id: 'client',
        subject: conversation.subject,
        message: message || '',
        attachments: attachments && attachments.length > 0 ? attachments : null,
        status: 'read' // Client messages are auto-read
      }
    });

    // Update conversation last_message_at
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { last_message_at: new Date() }
    });

    // Send email notification to partner (async, don't wait)
    notifyNewMessage({ message: newMessage, conversation }).catch(err => {
      console.error('[MESSAGE_API] Failed to send notification:', err);
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      messageId: newMessage.id
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

