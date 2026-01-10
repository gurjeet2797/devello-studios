import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import prisma from '../../../../lib/prisma';
import { notifyNewMessage } from '../../../../lib/messageNotificationHelper';

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
      include: { profile: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { id } = req.query;
    const { message, attachments } = req.body;

    if (!message && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message or attachments are required' });
    }

    // Get conversation with full relationships for notifications
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        partner: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        },
        user: {
          include: { profile: true }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify user owns this conversation
    if (conversation.user_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get sender name from profile
    const senderName = user.profile?.first_name 
      ? `${user.profile.first_name}${user.profile.last_name ? ' ' + user.profile.last_name : ''}`
      : supabaseUser.email?.split('@')[0] || 'Client';

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial message
    const sendSSE = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Generate a temporary message ID for streaming
    const tempMessageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Send message created event with temp ID (before streaming)
    sendSSE({
      type: 'message_created',
      message: {
        id: tempMessageId,
        message: '',
        senderName: senderName,
        senderId: 'client',
        createdAt: new Date().toISOString()
      }
    });

    // Simulate streaming response (word by word)
    const words = message.split(' ');
    let streamedText = '';
    
    for (let i = 0; i < words.length; i++) {
      streamedText += (i > 0 ? ' ' : '') + words[i];
      
      sendSSE({
        type: 'stream',
        chunk: words[i] + (i < words.length - 1 ? ' ' : ''),
        messageId: tempMessageId,
        complete: i === words.length - 1
      });

      // Small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    // Create message in database after streaming
    const newMessage = await prisma.partnerMessage.create({
      data: {
        partner_id: conversation.partner_id,
        conversation_id: conversation.id,
        user_id: user.id,
        sender_name: senderName,
        sender_email: supabaseUser.email || '',
        sender_id: 'client',
        subject: conversation.subject,
        message: message || '',
        attachments: attachments && attachments.length > 0 ? attachments : null,
        status: 'read'
      }
    });

    // Update conversation last_message_at
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { last_message_at: new Date() }
    });

    // Send email notification to partner (async, don't wait)
    notifyNewMessage({ message: newMessage, conversation }).catch(err => {
      console.error('[MESSAGE_STREAM_API] Failed to send notification:', err);
    });

    // Send completion event with real message ID
    sendSSE({
      type: 'complete',
      messageId: tempMessageId,
      realMessageId: newMessage.id,
      message: {
        id: newMessage.id,
        message: newMessage.message,
        senderName: newMessage.sender_name,
        senderId: newMessage.sender_id,
        createdAt: newMessage.created_at
      }
    });

    res.end();
  } catch (error) {
    console.error('Error streaming message:', error);
    if (!res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Internal server error' })}\n\n`);
    }
    res.end();
  }
}

