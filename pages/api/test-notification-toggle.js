// Test endpoint to debug notification toggle
import { createSupabaseAuthClient } from '../../lib/supabaseClient';
import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { enabled, type } = req.body; // type: 'user' or 'partner'

    console.log('[TEST_NOTIFICATION_TOGGLE] Starting test', { enabled, type });

    // Get the session
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No auth header' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const supabase = createSupabaseAuthClient();
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !supabaseUser) {
      return res.status(401).json({ error: 'Unauthorized - Auth error', details: authError?.message });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { supabase_user_id: supabaseUser.id },
      include: { profile: true, partner: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (type === 'user') {
      // Test user profile update
      try {
        const result = await prisma.userProfile.upsert({
          where: { user_id: user.id },
          update: {
            email_notifications_enabled: enabled
          },
          create: {
            user_id: user.id,
            email_notifications_enabled: enabled,
            first_name: null,
            last_name: null
          }
        });

        return res.status(200).json({
          success: true,
          type: 'user',
          result: {
            userId: user.id,
            emailNotificationsEnabled: result.email_notifications_enabled
          }
        });
      } catch (error) {
        return res.status(500).json({
          error: 'User profile update failed',
          message: error.message,
          code: error.code,
          meta: error.meta
        });
      }
    } else if (type === 'partner') {
      // Test partner update
      const partner = await prisma.partner.findUnique({
        where: { user_id: user.id }
      });

      if (!partner) {
        return res.status(404).json({ error: 'Partner not found' });
      }

      try {
        const result = await prisma.partner.update({
          where: { id: partner.id },
          data: {
            email_notifications_enabled: enabled
          }
        });

        return res.status(200).json({
          success: true,
          type: 'partner',
          result: {
            partnerId: partner.id,
            emailNotificationsEnabled: result.email_notifications_enabled
          }
        });
      } catch (error) {
        return res.status(500).json({
          error: 'Partner update failed',
          message: error.message,
          code: error.code,
          meta: error.meta
        });
      }
    } else {
      return res.status(400).json({ error: 'Invalid type. Use "user" or "partner"' });
    }
  } catch (error) {
    console.error('[TEST_NOTIFICATION_TOGGLE] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: error.stack,
      code: error.code
    });
  }
}

