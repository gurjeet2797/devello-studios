import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
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

    const { id } = req.query;
    const { status, title, description, estimatedCompletion, completedAt } = req.body;

    // Get project
    const project = await prisma.project.findUnique({
      where: { id },
      include: { partner: true }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify user has access (partner or client)
    const isPartner = user.partner && project.partner_id === user.partner.id;
    const isClient = project.user_id === user.id;

    if (!isPartner && !isClient) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Build update data
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (estimatedCompletion !== undefined) {
      updateData.estimated_completion = estimatedCompletion ? new Date(estimatedCompletion) : null;
    }
    if (completedAt !== undefined) {
      updateData.completed_at = completedAt ? new Date(completedAt) : null;
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
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
      project: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

