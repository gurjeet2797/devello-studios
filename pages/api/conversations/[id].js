import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    const { id, after } = req.query;

    // If after parameter is provided, find the message and get messages created after it
    let afterTimestamp = null;
    if (after) {
      const afterMessage = await prisma.partnerMessage.findUnique({
        where: { id: after },
        select: { created_at: true }
      });
      if (afterMessage) {
        afterTimestamp = afterMessage.created_at;
      }
    }

    // Get conversation with messages (incremental if after parameter provided)
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        partner: {
          select: {
            id: true,
            company_name: true,
            service_type: true,
            description: true
          }
        },
        messages: {
          where: afterTimestamp ? {
            created_at: {
              gt: afterTimestamp // Get messages created after the specified timestamp
            }
          } : undefined,
          orderBy: { created_at: 'asc' },
          include: {
            reply_to: {
              select: {
                id: true,
                message: true,
                sender_id: true
              }
            }
          }
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

    // Get unread count (don't mark as read here - let client mark when actually viewed)
    const unreadCount = await prisma.partnerMessage.count({
      where: {
        conversation_id: id,
        sender_id: 'partner',
        status: 'new'
      }
    });

    return res.status(200).json({
      conversation: {
        id: conversation.id,
        partner: {
          id: conversation.partner.id,
          companyName: conversation.partner.company_name,
          serviceType: conversation.partner.service_type,
          description: conversation.partner.description
        },
        subject: conversation.subject,
        status: conversation.status,
        unreadCount,
        messages: conversation.messages.map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          message: msg.message,
          attachments: msg.attachments,
          replyTo: msg.reply_to ? {
            id: msg.reply_to.id,
            message: msg.reply_to.message,
            senderId: msg.reply_to.sender_id
          } : null,
          createdAt: msg.created_at
        })),
        createdAt: conversation.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

