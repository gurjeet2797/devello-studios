import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  try {
    console.log('[PARTNERS_NOTIFICATIONS_API] Request received', {
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // Get the session
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[PARTNERS_NOTIFICATIONS_API] No auth header');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const supabase = createSupabaseAuthClient();
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !supabaseUser) {
      console.log('[PARTNERS_NOTIFICATIONS_API] Auth error:', authError?.message);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[PARTNERS_NOTIFICATIONS_API] User authenticated', {
      supabaseUserId: supabaseUser.id
    });

    // Get user
    const user = await prisma.user.findUnique({
      where: { supabase_user_id: supabaseUser.id }
    });

    if (!user) {
      console.log('[PARTNERS_NOTIFICATIONS_API] User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    // Get partner record
    const partner = await prisma.partner.findUnique({
      where: { user_id: user.id }
    });

    if (!partner || partner.status !== 'approved') {
      console.log('[PARTNERS_NOTIFICATIONS_API] Partner not found or not approved', {
        hasPartner: !!partner,
        status: partner?.status
      });
      return res.status(403).json({ error: 'Partner access required' });
    }

    console.log('[PARTNERS_NOTIFICATIONS_API] Partner found', {
      partnerId: partner.id,
      currentNotificationsEnabled: partner.email_notifications_enabled
    });

    if (req.method === 'GET') {
      // Get notification preferences - default to true for new partners
      const emailNotificationsEnabled = partner.email_notifications_enabled ?? true;

      return res.status(200).json({
        emailNotificationsEnabled
      });
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      // Update notification preferences
      const { emailNotificationsEnabled } = req.body;

      console.log('[PARTNERS_NOTIFICATIONS_API] Updating notifications', {
        partnerId: partner.id,
        emailNotificationsEnabled,
        type: typeof emailNotificationsEnabled
      });

      if (typeof emailNotificationsEnabled !== 'boolean') {
        console.error('[PARTNERS_NOTIFICATIONS_API] Invalid type:', typeof emailNotificationsEnabled);
        return res.status(400).json({ error: 'emailNotificationsEnabled must be a boolean' });
      }

      try {
        console.log('[PARTNERS_NOTIFICATIONS_API] Attempting to update partner', {
          partnerId: partner.id,
          currentValue: partner.email_notifications_enabled,
          newValue: emailNotificationsEnabled
        });

        const result = await prisma.partner.update({
          where: { id: partner.id },
          data: {
            email_notifications_enabled: emailNotificationsEnabled
          }
        });

        console.log('[PARTNERS_NOTIFICATIONS_API] Partner updated successfully', {
          partnerId: partner.id,
          emailNotificationsEnabled: result.email_notifications_enabled
        });

        return res.status(200).json({
          success: true,
          emailNotificationsEnabled
        });
      } catch (updateError) {
        console.error('[PARTNERS_NOTIFICATIONS_API] Update error:', {
          message: updateError.message,
          code: updateError.code,
          meta: updateError.meta,
          stack: updateError.stack
        });
        throw updateError;
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[PARTNERS_NOTIFICATIONS_API] Error handling notification preferences:', error);
    console.error('[PARTNERS_NOTIFICATIONS_API] Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

