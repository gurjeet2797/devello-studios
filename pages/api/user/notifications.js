import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  try {
    console.log('[USER_NOTIFICATIONS_API] Request received', {
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // Get the session
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[USER_NOTIFICATIONS_API] No auth header');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const supabase = createSupabaseAuthClient();
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !supabaseUser) {
      console.log('[USER_NOTIFICATIONS_API] Auth error:', authError?.message);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[USER_NOTIFICATIONS_API] User authenticated', {
      supabaseUserId: supabaseUser.id
    });

    // Get user
    const user = await prisma.user.findUnique({
      where: { supabase_user_id: supabaseUser.id },
      include: { profile: true }
    });

    if (!user) {
      console.log('[USER_NOTIFICATIONS_API] User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[USER_NOTIFICATIONS_API] User found', {
      userId: user.id,
      hasProfile: !!user.profile,
      currentNotificationsEnabled: user.profile?.email_notifications_enabled
    });

    if (req.method === 'GET') {
      // Get notification preferences - default to true for new users
      const emailNotificationsEnabled = user.profile?.email_notifications_enabled ?? true;

      return res.status(200).json({
        emailNotificationsEnabled
      });
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      // Update notification preferences
      const { emailNotificationsEnabled } = req.body;

      console.log('[USER_NOTIFICATIONS_API] Updating notifications', {
        userId: user.id,
        emailNotificationsEnabled,
        type: typeof emailNotificationsEnabled
      });

      if (typeof emailNotificationsEnabled !== 'boolean') {
        console.error('[USER_NOTIFICATIONS_API] Invalid type:', typeof emailNotificationsEnabled);
        return res.status(400).json({ error: 'emailNotificationsEnabled must be a boolean' });
      }

      // Use upsert to create or update profile
      try {
        // Check if profile exists first
        const existingProfile = await prisma.userProfile.findUnique({
          where: { user_id: user.id }
        });

        let result;
        if (existingProfile) {
          // Update existing profile
          console.log('[USER_NOTIFICATIONS_API] Updating existing profile');
          result = await prisma.userProfile.update({
            where: { user_id: user.id },
            data: {
              email_notifications_enabled: emailNotificationsEnabled
            }
          });
        } else {
          // Create new profile
          console.log('[USER_NOTIFICATIONS_API] Creating new profile');
          result = await prisma.userProfile.create({
            data: {
              user_id: user.id,
              email_notifications_enabled: emailNotificationsEnabled,
              first_name: null,
              last_name: null
            }
          });
        }

        console.log('[USER_NOTIFICATIONS_API] Profile updated successfully', {
          userId: user.id,
          emailNotificationsEnabled: result.email_notifications_enabled
        });

        return res.status(200).json({
          success: true,
          emailNotificationsEnabled
        });
      } catch (dbError) {
        console.error('[USER_NOTIFICATIONS_API] Database error:', {
          message: dbError.message,
          code: dbError.code,
          meta: dbError.meta,
          stack: dbError.stack
        });
        throw dbError;
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[USER_NOTIFICATIONS_API] Error handling notification preferences:', error);
    console.error('[USER_NOTIFICATIONS_API] Error details:', {
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

