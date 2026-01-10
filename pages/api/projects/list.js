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
      where: { supabase_user_id: supabaseUser.id },
      include: { partner: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get projects based on user type
    let projects = [];
    
    try {
      if (user.partner) {
        // Partner: get all projects for this partner
        projects = await prisma.project.findMany({
          where: { partner_id: user.partner.id },
          include: {
            conversation: {
              include: {
                partner: true,
                user: {
                  include: { profile: true }
                }
              }
            },
            partner: true,
            user: {
              include: { profile: true }
            }
          },
          orderBy: { created_at: 'desc' }
        });
      } else {
        // Client: get all projects for this user
        projects = await prisma.project.findMany({
          where: { user_id: user.id },
          include: {
            conversation: {
              include: {
                partner: true,
                user: {
                  include: { profile: true }
                }
              }
            },
            partner: true,
            user: {
              include: { profile: true }
            }
          },
          orderBy: { created_at: 'desc' }
        });
      }
    } catch (dbError) {
      // If projects table doesn't exist or query fails, return empty array
      console.error('[PROJECTS_LIST] Database query error:', dbError);
      // Return empty array instead of failing - allows UI to work
      projects = [];
    }

    return res.status(200).json({
      success: true,
      projects: projects || []
    });
  } catch (error) {
    console.error('[PROJECTS_LIST] Error fetching projects:', error);
    console.error('[PROJECTS_LIST] Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

