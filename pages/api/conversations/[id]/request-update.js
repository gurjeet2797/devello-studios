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
      include: { profile: true, partner: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { id } = req.query;

    // Get conversation
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

    // Verify user is part of this conversation
    const isClient = conversation.user_id === user.id;
    const isPartner = conversation.partner_id === user.partner?.id;

    if (!isClient && !isPartner) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Determine sender info
    const senderName = user.profile 
      ? `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim() || user.email
      : user.email;
    const senderId = isPartner ? 'partner' : 'client';

    // Create update request message
    const updateMessage = await prisma.partnerMessage.create({
      data: {
        partner_id: conversation.partner_id,
        conversation_id: conversation.id,
        user_id: isClient ? user.id : null,
        sender_name: senderName,
        sender_email: user.email,
        sender_id: senderId,
        subject: conversation.subject,
        message: `📋 Status update requested by ${senderName}`,
        status: 'new'
      }
    });

    // Update conversation last_message_at
    await prisma.conversation.update({
      where: { id },
      data: {
        last_message_at: new Date()
      }
    });

    // Notify recipient (async, don't wait)
    notifyNewMessage({ message: updateMessage, conversation }).catch(err => {
      console.error('[REQUEST_UPDATE_API] Failed to send notification:', err);
    });

    return res.status(200).json({
      success: true,
      message: updateMessage
    });
  } catch (error) {
    console.error('Error requesting update:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

