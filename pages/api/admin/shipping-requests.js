import { PrismaClient } from '@prisma/client';
import { getSupabase } from '../../../lib/supabaseClient';
import { isAdminEmail } from '../../../lib/adminAuth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check admin status
    const admin = await isAdminEmail(session.user.email);
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fetch shipping requests
    const requests = await prisma.shippingRequest.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to most recent 100
    });

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error('Error fetching shipping requests:', error);
    return res.status(500).json({
      error: 'Failed to fetch shipping requests',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

