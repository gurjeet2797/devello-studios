import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token using auth client (anon key)
    const supabase = createSupabaseAuthClient();
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !supabaseUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { supabase_user_id: supabaseUser.id }
    });

    const { isAdminEmail } = require('../../../../lib/adminAuth');
    if (!adminUser || !isAdminEmail(adminUser.email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { partner_id } = req.body;

    if (!partner_id) {
      return res.status(400).json({ error: 'Missing partner_id' });
    }

    // Get partner record to verify it exists
    const partner = await prisma.partner.findUnique({
      where: { id: partner_id },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Delete the partner (cascade will handle related records)
    await prisma.partner.delete({
      where: { id: partner_id }
    });

    return res.status(200).json({
      success: true,
      message: 'Partner deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting partner:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

