import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import prisma from '../../../../lib/prisma';

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

    // Only partners can approve phone sharing
    if (!user.partner) {
      return res.status(403).json({ error: 'Only partners can approve phone sharing' });
    }

    const { id } = req.query;

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { partner: true }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify partner owns this conversation
    if (conversation.partner_id !== user.partner.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update phone sharing approval
    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        phone_sharing_approved: true
      },
      include: {
        partner: true,
        user: true
      }
    });

    return res.status(200).json({
      success: true,
      conversation: updatedConversation
    });
  } catch (error) {
    console.error('Error approving phone sharing:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

