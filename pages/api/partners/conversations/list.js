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
      select: { id: true, status: true }
    });

    if (!partner || partner.status !== 'approved') {
      return res.status(403).json({ error: 'Partner access required' });
    }

    // Get all conversations for this partner
    const conversations = await prisma.conversation.findMany({
      where: { partner_id: partner.id },
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
          orderBy: { created_at: 'desc' },
          take: 1 // Get last message for preview
        }
      },
      orderBy: { last_message_at: 'desc' }
    });

    // Check which conversations have partner replies
    const conversationIds = conversations.map(c => c.id);
    let partnerRepliedConversations = [];
    let unreadCounts = [];
    
    if (conversationIds.length > 0) {
      partnerRepliedConversations = await prisma.partnerMessage.groupBy({
        by: ['conversation_id'],
        where: {
          conversation_id: { in: conversationIds },
          sender_id: 'partner'
        }
      });

      // Get unread message counts for each conversation (client messages with status 'new')
      unreadCounts = await prisma.partnerMessage.groupBy({
        by: ['conversation_id'],
        where: {
          conversation_id: { in: conversationIds },
          sender_id: 'client',
          status: 'new'
        },
        _count: {
          id: true
        }
      });
    }

    const repliedIds = new Set(partnerRepliedConversations.map(m => m.conversation_id).filter(Boolean));

    const unreadCountMap = new Map(
      unreadCounts.map(item => [item.conversation_id, item._count.id])
    );

    return res.status(200).json({
      requests: conversations
        .filter(conv => !repliedIds.has(conv.id))
        .map(conv => ({
          id: conv.id,
          user: {
            id: conv.user?.id || null,
            email: conv.user?.email || null,
            firstName: conv.user?.profile?.first_name || null,
            lastName: conv.user?.profile?.last_name || null
          },
          subject: conv.subject,
          status: conv.status,
          unreadCount: unreadCountMap.get(conv.id) || 0,
          lastMessage: conv.messages[0] ? {
            message: conv.messages[0].message,
            senderId: conv.messages[0].sender_id,
            senderName: conv.messages[0].sender_name,
            createdAt: conv.messages[0].created_at
          } : null,
          lastMessageAt: conv.last_message_at,
          createdAt: conv.created_at
        })),
      messages: conversations
        .filter(conv => repliedIds.has(conv.id))
        .map(conv => ({
          id: conv.id,
          user: {
            id: conv.user?.id || null,
            email: conv.user?.email || null,
            firstName: conv.user?.profile?.first_name || null,
            lastName: conv.user?.profile?.last_name || null
          },
          subject: conv.subject,
          status: conv.status,
          unreadCount: unreadCountMap.get(conv.id) || 0,
          lastMessage: conv.messages[0] ? {
            message: conv.messages[0].message,
            senderId: conv.messages[0].sender_id,
            senderName: conv.messages[0].sender_name,
            createdAt: conv.messages[0].created_at
          } : null,
          lastMessageAt: conv.last_message_at,
          createdAt: conv.created_at
        }))
    });
  } catch (error) {
    console.error('Error fetching partner conversations:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

