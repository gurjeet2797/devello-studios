/**
 * POST /api/studios/ideation/confirm
 * 
 * Save the finalized idea concept to a conversation.
 * Creates a conversation with a software partner.
 */

import prismaClient from '../../../../lib/prisma';
import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';

const { sendAdminBuildRequestNotification } = require('../../../../lib/emailService');

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
    // Get user (optional - can be guest)
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const supabase = createSupabaseAuthClient();
      const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && supabaseUser) {
        user = await prisma.user.findUnique({
          where: { supabase_user_id: supabaseUser.id },
          include: { profile: true }
        });
      }
    }

    const { ideaId, result, email, phone } = req.body;

    if (!ideaId || !result) {
      return res.status(400).json({
        error: 'ideaId and result are required'
      });
    }

    // Validate contact info
    const contactEmail = email || user?.email;
    const contactPhone = phone;
    
    if (!contactEmail || !contactPhone) {
      return res.status(400).json({
        error: 'Email and phone number are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Verify the job exists and belongs to the user (optional check)
    const job = await prisma.ideationJob.findUnique({
      where: { id: ideaId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Ideation job not found' });
    }

    // Get user name from profile or email
    let senderName = 'Guest User';
    if (user?.profile?.first_name && user.profile?.last_name) {
      senderName = `${user.profile.first_name} ${user.profile.last_name}`;
    } else if (user?.profile?.first_name) {
      senderName = user.profile.first_name;
    } else if (contactEmail) {
      senderName = contactEmail.split('@')[0];
    }

    // Build message content
    const productName = result.name || 'New App Concept';
    const messageParts = [
      `**Product:** ${result.name || 'Unnamed'}`,
      `**Tagline:** ${result.tagline || 'N/A'}`,
      '',
      `**Description:** ${result.description || result.tagline || 'N/A'}`,
      '',
      `**Contact Email:** ${contactEmail}`,
      `**Contact Phone:** ${contactPhone}`
    ].filter(Boolean);
    const message = messageParts.join('\n');

    // Find an approved software partner (optional - for conversation creation)
    const partner = await prisma.partner.findFirst({
      where: {
        service_type: 'software_development',
        status: 'approved'
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    let conversation = null;
    let partnerMessage = null;

    // Create conversation if partner exists and user exists
    if (partner && user) {
      const subject = `Build Request: ${productName}`;
      
      // Check if conversation already exists
      conversation = await prisma.conversation.findFirst({
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

      // Create initial message with the concept
      partnerMessage = await prisma.partnerMessage.create({
        data: {
          partner_id: partner.id,
          conversation_id: conversation.id,
          user_id: user.id,
          sender_name: senderName,
          sender_email: contactEmail,
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

      console.log(`[IDEATION_CONFIRM] Created conversation ${conversation.id} for user ${user?.id || 'guest'}`);
    }

    // Send admin notification email
    try {
      await sendAdminBuildRequestNotification({
        productName: result.name || 'New App Concept',
        productTagline: result.tagline || '',
        productDescription: result.description || result.tagline || '',
        customerName: senderName,
        customerEmail: contactEmail,
        customerPhone: contactPhone,
        ideaId: ideaId,
        showcaseImage: result.showcase?.image_url || null
      });
      console.log(`[IDEATION_CONFIRM] Admin notification sent for build request`);
    } catch (emailError) {
      console.error('[IDEATION_CONFIRM] Failed to send admin notification:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(200).json({
      success: true,
      message: 'Build request submitted successfully',
      conversationId: conversation?.id || null,
      messageId: partnerMessage?.id || null
    });

  } catch (error) {
    console.error('[IDEATION_CONFIRM] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
