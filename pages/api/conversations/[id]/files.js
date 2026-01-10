import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Create file record (file should be uploaded client-side to Supabase first)
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

      const { id } = req.query;
      const { fileUrl, fileName, fileSize, fileType, mimeType } = req.body;

      if (!fileUrl || !fileName) {
        return res.status(400).json({ error: 'File URL and name are required' });
      }

      // Get conversation
      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: { partner: true, user: true }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Verify user is part of this conversation
      const isClient = conversation.user_id === user.id;
      const isPartner = conversation.partner?.user_id === user.id;

      if (!isClient && !isPartner) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Create conversation file record
      const conversationFile = await prisma.conversationFile.create({
        data: {
          conversation_id: conversation.id,
          uploaded_by_id: user.id,
          file_name: fileName,
          file_url: fileUrl,
          file_size: fileSize || 0,
          file_type: fileType || 'file',
          mime_type: mimeType
        }
      });

      return res.status(200).json({
        success: true,
        file: conversationFile
      });
    } catch (error) {
      console.error('Error creating file record:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    // Get files
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

      const { id } = req.query;

      // Get conversation
      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: { partner: true }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Verify user is part of this conversation
      const isClient = conversation.user_id === user.id;
      const isPartner = conversation.partner_id === user.partner?.id;

      if (!isClient && !isPartner) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Get files
      const files = await prisma.conversationFile.findMany({
        where: { conversation_id: id },
        orderBy: { created_at: 'desc' },
        include: {
          uploaded_by: {
            include: { profile: true }
          }
        }
      });

      return res.status(200).json({
        success: true,
        files
      });
    } catch (error) {
      console.error('Error fetching files:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

