import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import prisma from '../../../../lib/prisma';

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

    // Get partner record
    const partner = await prisma.partner.findUnique({
      where: { user_id: user.id },
      select: { id: true, status: true, company_name: true }
    });

    if (!partner || partner.status !== 'approved') {
      return res.status(403).json({ error: 'Partner access required' });
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
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        messages: {
          where: afterTimestamp ? {
            created_at: {
              gt: afterTimestamp
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

    // Verify partner owns this conversation
    if (conversation.partner_id !== partner.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get unread count (don't mark as read here - let client mark when actually viewed)
    const unreadCount = await prisma.partnerMessage.count({
      where: {
        conversation_id: id,
        sender_id: 'client',
        status: 'new'
      }
    });

    return res.status(200).json({
      conversation: {
        id: conversation.id,
        user: {
          id: conversation.user?.id || null,
          email: conversation.user?.email || null,
          firstName: conversation.user?.profile?.first_name || null,
          lastName: conversation.user?.profile?.last_name || null
        },
        subject: conversation.subject,
        status: conversation.status,
        unreadCount,
        messages: conversation.messages.map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          senderEmail: msg.sender_email,
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
    console.error('Error fetching partner conversation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

