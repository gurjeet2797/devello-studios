import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import prisma from '../../../../lib/prisma';

// Store active users per conversation (in production, use Redis or similar)
const activeUsers = new Map();

export default async function handler(req, res) {
  const { id: conversationId } = req.query;

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

    if (req.method === 'POST') {
      // Update presence (user is active)
      const key = `${conversationId}_${user.id}`;
      activeUsers.set(key, {
        userId: user.id,
        conversationId,
        lastSeen: new Date(),
        isTyping: req.body.isTyping || false
      });

      // Clean up old entries (older than 30 seconds)
      const now = new Date();
      for (const [k, v] of activeUsers.entries()) {
        if (v.conversationId === conversationId && (now - v.lastSeen) > 30000) {
          activeUsers.delete(k);
        }
      }

      return res.status(200).json({ success: true });
    } else if (req.method === 'GET') {
      // Get active users for this conversation
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { user: true, partner: { include: { user: true } } }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Get active users
      const active = Array.from(activeUsers.values())
        .filter(u => u.conversationId === conversationId)
        .map(u => ({
          userId: u.userId,
          isTyping: u.isTyping,
          lastSeen: u.lastSeen
        }));

      // Check if client is active
      const clientActive = conversation.user_id ? active.some(a => a.userId === conversation.user_id) : false;
      const partnerActive = conversation.partner?.user_id ? active.some(a => a.userId === conversation.partner.user_id) : false;

      return res.status(200).json({
        clientActive,
        partnerActive,
        activeUsers: active
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling presence:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

