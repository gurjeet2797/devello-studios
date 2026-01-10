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

    // Get all conversations for this user
    const conversations = await prisma.conversation.findMany({
      where: { user_id: user.id },
      include: {
        partner: {
          select: {
            id: true,
            company_name: true,
            service_type: true
          }
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 10 // Get recent messages for preview
        }
      },
      orderBy: { last_message_at: 'desc' }
    });

    // Get unread message counts for each conversation
    const conversationIds = conversations.map(c => c.id);
    let unreadCounts = [];
    if (conversationIds.length > 0) {
      unreadCounts = await prisma.partnerMessage.groupBy({
        by: ['conversation_id'],
        where: {
          conversation_id: { in: conversationIds },
          sender_id: 'partner',
          status: 'new'
        },
        _count: {
          id: true
        }
      });
    }

    const unreadCountMap = new Map(
      unreadCounts.map(item => [item.conversation_id, item._count.id])
    );

    return res.status(200).json({
      conversations: conversations
        .filter(conv => conv.partner) // Filter out conversations without partners
        .map(conv => ({
          id: conv.id,
          partner: {
            id: conv.partner.id,
            companyName: conv.partner.company_name,
            serviceType: conv.partner.service_type
          },
          subject: conv.subject,
          status: conv.status,
          unreadCount: unreadCountMap.get(conv.id) || 0,
        lastMessage: conv.messages[0] ? {
          message: conv.messages[0].message,
          senderId: conv.messages[0].sender_id,
          createdAt: conv.messages[0].created_at
        } : null,
        previewMessages: (() => {
          // Get the most recent message from client and most recent from partner for preview
          // This shows one message from each side so users can see the conversation exchange
          const clientMessages = conv.messages.filter(m => m.sender_id === 'client');
          const partnerMessages = conv.messages.filter(m => m.sender_id === 'partner');
          const messages = [];
          
          // Get most recent client message (if exists)
          if (clientMessages.length > 0) {
            const clientMsg = clientMessages[0]; // Already sorted desc
            messages.push({
              message: clientMsg.message,
              senderId: clientMsg.sender_id,
              senderName: clientMsg.sender_name,
              createdAt: clientMsg.created_at
            });
          }
          
          // Get most recent partner message (if exists)
          if (partnerMessages.length > 0) {
            const partnerMsg = partnerMessages[0]; // Already sorted desc
            messages.push({
              message: partnerMsg.message,
              senderId: partnerMsg.sender_id,
              senderName: partnerMsg.sender_name,
              createdAt: partnerMsg.created_at
            });
          }
          
          // Sort by date (oldest first for preview to show conversation flow)
          return messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        })(),
        lastMessageAt: conv.last_message_at,
        createdAt: conv.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

