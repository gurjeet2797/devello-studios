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
      include: { partner: true, profile: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only partners can approve requests
    if (!user.partner) {
      return res.status(403).json({ error: 'Only partners can approve requests' });
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

    // Check if partner has already replied (if so, request is already approved)
    const existingPartnerMessage = await prisma.partnerMessage.findFirst({
      where: {
        conversation_id: id,
        sender_id: 'partner'
      }
    });

    if (existingPartnerMessage) {
      return res.status(400).json({ error: 'Request already approved' });
    }

    // Get partner info for the message
    const partnerName = user.partner.company_name || user.profile?.first_name || 'Partner';
    const partnerEmail = user.email || '';

    // Create approval message
    const approvalMessage = await prisma.partnerMessage.create({
      data: {
        partner_id: user.partner.id,
        conversation_id: id,
        user_id: conversation.user_id,
        sender_id: 'partner',
        sender_name: partnerName,
        sender_email: partnerEmail,
        subject: conversation.subject,
        message: 'Thank you for your request. I\'ve received it and will get back to you soon.',
        status: 'read' // Mark as read since partner sent it
      }
    });

    // Update conversation last_message_at
    await prisma.conversation.update({
      where: { id },
      data: {
        last_message_at: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: approvalMessage
    });
  } catch (error) {
    console.error('Error approving request:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

