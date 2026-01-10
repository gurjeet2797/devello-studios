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

    // Only partners can create projects
    if (!user.partner) {
      return res.status(403).json({ error: 'Only partners can create projects' });
    }

    const { conversationId, title, description, projectType, estimatedCompletion } = req.body;

    if (!conversationId || !title || !projectType) {
      return res.status(400).json({ error: 'Conversation ID, title, and project type are required' });
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

    // Check if project already exists for this conversation
    const existingProject = await prisma.project.findUnique({
      where: { conversation_id: conversationId }
    });

    if (existingProject) {
      return res.status(400).json({ error: 'Project already exists for this conversation' });
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        conversation_id: conversationId,
        partner_id: user.partner.id,
        user_id: conversation.user_id,
        title,
        description,
        project_type: projectType,
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
      project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

