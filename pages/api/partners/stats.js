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

    // Get partner record
    const partner = await prisma.partner.findUnique({
      where: { user_id: user.id },
      select: { id: true, status: true }
    });

    if (!partner || partner.status !== 'approved') {
      return res.status(403).json({ error: 'Partner access required' });
    }

    // Optimized: Use parallel queries and database aggregations
    const [
      conversations,
      partnerRepliedConversations,
      unreadCounts,
      repliedMessagesForResponseTime
    ] = await Promise.all([
      // Get conversation IDs only (minimal data)
      prisma.conversation.findMany({
        where: { partner_id: partner.id },
        select: { id: true }
      }),
      // Check which conversations have partner replies
      prisma.partnerMessage.groupBy({
        by: ['conversation_id'],
        where: {
          partner_id: partner.id,
          sender_id: 'partner'
        }
      }),
      // Get unread message counts for each conversation
      prisma.partnerMessage.groupBy({
        by: ['conversation_id'],
        where: {
          partner_id: partner.id,
          sender_id: 'client',
          status: 'new'
        },
        _count: {
          id: true
        }
      }),
      // Get only replied messages for response time calculation (with minimal fields)
      prisma.partnerMessage.findMany({
        where: {
          partner_id: partner.id,
          status: 'replied',
          sender_id: 'partner',
          replied_at: { not: null },
          created_at: { not: null }
        },
        select: {
          replied_at: true,
          created_at: true
        }
      })
    ]);

    const conversationIds = conversations.map(c => c.id);
    const repliedIds = new Set(partnerRepliedConversations.map(m => m.conversation_id).filter(Boolean));
    const conversationsWithUnread = new Set(unreadCounts.map(item => item.conversation_id).filter(Boolean));

    // Open requests are conversations that haven't been replied to by the partner
    const openRequests = conversations.filter(c => !repliedIds.has(c.id)).length;
    
    // Active projects are conversations that have been replied to
    const activeProjects = conversations.filter(c => repliedIds.has(c.id)).length;

    // New Messages: count of conversations with unread messages (not total message count)
    const newMessages = conversationsWithUnread.size;

    // Calculate average response time (in hours) from partner replies
    let avgResponseHours = 0;
    
    if (repliedMessagesForResponseTime.length > 0) {
      const totalResponseTime = repliedMessagesForResponseTime.reduce((sum, m) => {
        const responseTime = new Date(m.replied_at) - new Date(m.created_at);
        return sum + responseTime;
      }, 0);
      avgResponseHours = Math.round(totalResponseTime / repliedMessagesForResponseTime.length / (1000 * 60 * 60));
    }

    // Format average response time
    let avgResponse = 'N/A';
    if (avgResponseHours > 0) {
      if (avgResponseHours < 24) {
        avgResponse = `${avgResponseHours}h`;
      } else {
        const days = Math.floor(avgResponseHours / 24);
        avgResponse = `${days}d`;
      }
    }

    return res.status(200).json({
      openRequests,
      activeProjects,
      newMessages,
      avgResponse
    });
  } catch (error) {
    console.error('Error fetching partner stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

