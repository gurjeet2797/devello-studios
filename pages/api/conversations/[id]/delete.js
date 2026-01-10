import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

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

    // Get conversation and verify ownership
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        partner: {
          select: {
            user_id: true
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user owns the conversation (client) or is the partner
    const isClientOwner = conversation.user_id === user.id;
    const isPartnerOwner = conversation.partner?.user_id === user.id;

    if (!isClientOwner && !isPartnerOwner) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Delete all messages in the conversation first (cascade should handle this, but being explicit)
    await prisma.partnerMessage.deleteMany({
      where: { conversation_id: id }
    });

    // Delete the conversation
    await prisma.conversation.delete({
      where: { id }
    });

    return res.status(200).json({ 
      success: true,
      message: 'Conversation deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

