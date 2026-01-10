import { createSupabaseAuthClient } from '../../../../../lib/supabaseClient';
import { UserService } from '../../../../../lib/userService';
import prismaClient from '../../../../../lib/prisma';

const prisma = prismaClient;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const prismaUser = await UserService.getOrCreateUser(user.id, user.email);
    if (!prismaUser) {
      return res.status(500).json({ error: 'Failed to retrieve user account' });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Fetch the order
    const order = await prisma.productOrder.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify user owns this order
    if (order.user_id !== prismaUser.id && order.guest_email?.toLowerCase() !== prismaUser.email.toLowerCase()) {
      return res.status(403).json({ error: 'You do not have permission to request updates for this order' });
    }

    // Create order update record
    await prisma.orderUpdate.create({
      data: {
        product_order_id: id,
        update_type: 'message',
        message: 'Client requested an update on this order.',
        updated_by: prismaUser.id,
      },
    });

    console.log('[REQUEST_UPDATE] Update requested:', {
      orderId: id,
      orderNumber: order.order_number,
      userId: prismaUser.id
    });

    return res.status(200).json({
      success: true,
      message: 'Update request sent to admin'
    });
  } catch (error) {
    console.error('[REQUEST_UPDATE] Error requesting update:', {
      error: error.message,
      stack: error.stack,
      orderId: req.query?.id
    });

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
