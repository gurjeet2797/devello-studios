/**
 * POST /api/studios/ideation/confirm
 * 
 * Save the finalized idea concept to a conversation.
 * Creates a conversation with a software partner.
 */

import prismaClient from '../../../lib/prisma';
import { createSupabaseAuthClient } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[IDEATION_CONFIRM] Prisma client not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;

  try {
    // Get user (required for creating conversation)
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const supabase = createSupabaseAuthClient();
      const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !supabaseUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      user = await prisma.user.findUnique({
        where: { supabase_user_id: supabaseUser.id },
        include: { profile: true }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
    } else {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ideaId, result } = req.body;

    if (!ideaId || !result) {
      return res.status(400).json({
        error: 'ideaId and result are required'
      });
    }

    // Verify the job exists and belongs to the user (optional check)
    const job = await prisma.ideationJob.findUnique({
      where: { id: ideaId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Ideation job not found' });
    }

    // Find an approved software partner
    const partner = await prisma.partner.findFirst({
      where: {
        service_type: 'software_development',
        status: 'approved'
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!partner) {
      return res.status(404).json({
        error: 'No software partner available. Please contact support.'
      });
    }

    // Build conversation subject and message
    const productName = result.name || 'New App Concept';
    const subject = `Build Request: ${productName}`;
    
    // Format the concept as a message
    const messageParts = [
      `**Product:** ${result.name || 'Unnamed'}`,
      `**Tagline:** ${result.tagline || 'N/A'}`,
      '',
      '**Core Features:**',
      ...(result.features || []).map(f => `• ${f}`),
      '',
      '**Technology Stack:**',
      `• Frontend: ${result.tech_stack?.frontend || 'TBD'}`,
      `• Backend: ${result.tech_stack?.backend || 'TBD'}`,
      `• Database: ${result.tech_stack?.database || 'TBD'}`,
      ...(result.tech_stack?.integrations || []).map(i => `• Integration: ${i}`),
      '',
      `**Monetization:** ${result.monetization || 'TBD'}`,
      '',
      '**Development Roadmap:**',
      ...(result.roadmap || []).map((r, i) => `${i + 1}. ${r}`),
      '',
      result.ui_inspiration ? `**UI/UX Notes:** ${result.ui_inspiration}` : ''
    ].filter(Boolean);

    const message = messageParts.join('\n');

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        partner_id: partner.id,
        user_id: user.id,
        subject: subject
      }
    });

    // Create conversation if it doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          partner_id: partner.id,
          user_id: user.id,
          subject: subject,
          status: 'active'
        }
      });
    }

    // Get user name from profile or email
    let senderName = 'User';
    if (user.profile?.first_name && user.profile?.last_name) {
      senderName = `${user.profile.first_name} ${user.profile.last_name}`;
    } else if (user.profile?.first_name) {
      senderName = user.profile.first_name;
    } else if (user.email) {
      senderName = user.email.split('@')[0];
    }

    // Create initial message with the concept
    const partnerMessage = await prisma.partnerMessage.create({
      data: {
        partner_id: partner.id,
        conversation_id: conversation.id,
        user_id: user.id,
        sender_name: senderName,
        sender_email: user.email || '',
        sender_id: 'client',
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

    console.log(`[IDEATION_CONFIRM] Created conversation ${conversation.id} for user ${user.id}`);

    return res.status(200).json({
      success: true,
      message: 'Build request saved successfully',
      conversationId: conversation.id,
      messageId: partnerMessage.id
    });

  } catch (error) {
    console.error('[IDEATION_CONFIRM] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
