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
      where: { supabase_user_id: supabaseUser.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get partner record (the partner creating the conversation)
    const requestingPartner = await prisma.partner.findUnique({
      where: { user_id: user.id },
      select: { id: true, status: true, company_name: true }
    });

    if (!requestingPartner || requestingPartner.status !== 'approved') {
      return res.status(403).json({ error: 'Partner access required' });
    }

    const { partnerId, subject, message } = req.body;

    if (!partnerId || !subject || !message) {
      return res.status(400).json({ error: 'partnerId, subject, and message are required' });
    }

    // Verify target partner exists and is approved
    const targetPartner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { id: true, status: true, company_name: true }
    });

    if (!targetPartner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    if (targetPartner.status !== 'approved') {
      return res.status(403).json({ error: 'Target partner is not approved' });
    }

    // Prevent partners from messaging themselves
    if (targetPartner.id === requestingPartner.id) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        partner_id: targetPartner.id,
        user_id: user.id,
        subject: subject
      }
    });

    // Create conversation if it doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          partner_id: targetPartner.id,
          user_id: user.id,
          subject: subject,
          status: 'active'
        }
      });
    }

    // Create initial message
    const partnerMessage = await prisma.partnerMessage.create({
      data: {
        partner_id: targetPartner.id,
        conversation_id: conversation.id,
        user_id: user.id,
        sender_name: requestingPartner.company_name,
        sender_email: supabaseUser.email || '',
        sender_id: 'client', // Partner acts as client when messaging another partner
        subject: subject,
        message: message.trim(),
        status: 'new'
      }
    });

    // Update conversation last_message_at
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { last_message_at: new Date() }
    });

    return res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      conversationId: conversation.id,
      messageId: partnerMessage.id
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

