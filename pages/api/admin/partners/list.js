import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import prisma from '../../../../lib/prisma';

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
    
    // Verify token using auth client (anon key)
    const supabase = createSupabaseAuthClient();
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !supabaseUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { supabase_user_id: supabaseUser.id }
    });

    const { isAdminEmail } = require('../../../../lib/adminAuth');
    if (!user || !isAdminEmail(user.email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get filter parameters
    const { status } = req.query;

    // Build where clause
    const where = status ? { status } : {};

    // Get all partners
    const partners = await prisma.partner.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            created_at: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.status(200).json({
      partners: partners.map(p => ({
        id: p.id,
        user_id: p.user_id,
        user_email: p.user.email,
        service_type: p.service_type,
        status: p.status,
        company_name: p.company_name,
        description: p.description,
        experience_years: p.experience_years,
        phone: p.phone,
        portfolio_url: p.portfolio_url,
        application_data: p.application_data,
        approved_at: p.approved_at,
        approved_by: p.approved_by,
        created_at: p.created_at,
        updated_at: p.updated_at
      }))
    });

  } catch (error) {
    console.error('Error fetching partners:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

