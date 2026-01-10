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
      console.error('[PARTNERS_MESSAGES] User not found in database:', {
        supabaseUserId: supabaseUser.id
      });
      return res.status(404).json({ error: 'User not found' });
    }

    // Get partner record
    const partner = await prisma.partner.findUnique({
      where: { user_id: user.id },
      select: { id: true, status: true }
    });

    if (!partner) {
      console.error('[PARTNERS_MESSAGES] Partner record not found:', {
        userId: user.id,
        email: supabaseUser.email
      });
      return res.status(403).json({ 
        error: 'Partner access required',
        details: 'No partner record found for this user'
      });
    }

    if (partner.status !== 'approved') {
      console.error('[PARTNERS_MESSAGES] Partner not approved:', {
        userId: user.id,
        partnerId: partner.id,
        status: partner.status
      });
      return res.status(403).json({ 
        error: 'Partner access required',
        details: `Partner status is ${partner.status}, must be approved`
      });
    }

    console.log('[PARTNERS_MESSAGES] Fetching messages for partner:', {
      partnerId: partner.id,
      partnerIdType: typeof partner.id,
      userId: user.id
    });

    // Get messages for this partner - ensure partner_id matches exactly
    const messages = await prisma.partnerMessage.findMany({
      where: { 
        partner_id: partner.id
      },
      orderBy: { created_at: 'desc' }
    });

    console.log('[PARTNERS_MESSAGES] Found messages:', {
      count: messages.length,
      messageIds: messages.map(m => ({ id: m.id, partnerId: m.partner_id }))
    });

    return res.status(200).json({
      messages: messages.map(m => ({
        id: m.id,
        senderName: m.sender_name,
        senderEmail: m.sender_email,
        senderPhone: m.sender_phone,
        subject: m.subject,
        message: m.message,
        status: m.status,
        readAt: m.read_at,
        repliedAt: m.replied_at,
        createdAt: m.created_at,
        conversationId: m.conversation_id,
        senderId: m.sender_id
      }))
    });
  } catch (error) {
    console.error('Error fetching partner messages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

