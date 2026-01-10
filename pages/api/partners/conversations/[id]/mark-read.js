import { createSupabaseAuthClient } from '../../../../../lib/supabaseClient';
import prisma from '../../../../../lib/prisma';

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
      select: { id: true, status: true }
    });

    if (!partner || partner.status !== 'approved') {
      return res.status(403).json({ error: 'Partner access required' });
    }

    const { id } = req.query;
    const { messageIds } = req.body; // Optional: specific message IDs to mark as read

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify partner owns this conversation
    if (conversation.partner_id !== partner.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Mark client messages as read
    const whereClause = {
      conversation_id: id,
      sender_id: 'client',
      status: 'new'
    };

    // If specific message IDs provided, only mark those as read
    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      whereClause.id = { in: messageIds };
    }

    const result = await prisma.partnerMessage.updateMany({
      where: whereClause,
      data: {
        status: 'read',
        read_at: new Date()
      }
    });

    // Get updated unread count
    const unreadCount = await prisma.partnerMessage.count({
      where: {
        conversation_id: id,
        sender_id: 'client',
        status: 'new'
      }
    });

    return res.status(200).json({
      success: true,
      markedAsRead: result.count,
      unreadCount
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

