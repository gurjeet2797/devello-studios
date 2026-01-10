import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import { UserService } from '../../../../lib/userService';
import prismaClient from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[LINK_GUEST_ORDERS] Prisma client is not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get user
    const supabase = createSupabaseAuthClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get or create user in Prisma
    const prismaUser = await UserService.getOrCreateUser(user.id, user.email);
    
    if (!prismaUser) {
      return res.status(500).json({ error: 'Failed to get or create user' });
    }

    console.log('[LINK_GUEST_ORDERS] Linking guest orders for user:', {
      userId: prismaUser.id,
      email: prismaUser.email
    });

    // Find all guest orders with matching email that don't have a user_id or have a different user_id
    const guestOrders = await prisma.productOrder.findMany({
      where: {
        guest_email: user.email,
        OR: [
          { user_id: { not: prismaUser.id } },
          { user_id: null }
        ]
      }
    });

    if (guestOrders.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No guest orders found to link',
        linkedCount: 0
      });
    }

    // Update all matching guest orders to link them to the user
    const updateResult = await prisma.productOrder.updateMany({
      where: {
        guest_email: user.email,
        OR: [
          { user_id: { not: prismaUser.id } },
          { user_id: null }
        ]
      },
      data: {
        user_id: prismaUser.id,
        // Keep guest_email for reference, but now it's linked to a user account
      }
    });

    console.log('[LINK_GUEST_ORDERS] Successfully linked guest orders:', {
      userId: prismaUser.id,
      email: user.email,
      linkedCount: updateResult.count
    });

    return res.status(200).json({
      success: true,
      message: `Successfully linked ${updateResult.count} order(s) to your account`,
      linkedCount: updateResult.count
    });
  } catch (error) {
    console.error('[LINK_GUEST_ORDERS] Error linking guest orders:', {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
