import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import prisma from '../../../lib/prisma';

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
      include: { partner: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only partners can create orders
    if (!user.partner) {
      return res.status(403).json({ error: 'Only partners can create orders' });
    }

    const { conversationId, title, description, estimatedCompletion } = req.body;

    if (!conversationId || !title) {
      return res.status(400).json({ error: 'Conversation ID and title are required' });
    }

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { partner: true, user: true }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify partner owns this conversation
    if (conversation.partner_id !== user.partner.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check if order already exists for this conversation
    const existingOrder = await prisma.order.findUnique({
      where: { conversation_id: conversationId }
    });

    if (existingOrder) {
      return res.status(400).json({ error: 'Order already exists for this conversation' });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        conversation_id: conversationId,
        partner_id: user.partner.id,
        user_id: conversation.user_id,
        title,
        description,
        status: 'pending',
        estimated_completion: estimatedCompletion ? new Date(estimatedCompletion) : null
      },
      include: {
        conversation: true,
        partner: true,
        user: {
          include: { profile: true }
        }
      }
    });

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

