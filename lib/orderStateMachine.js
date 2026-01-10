import prisma from './prisma';

const ALLOWED_TRANSITIONS = {
  pending: ['awaiting_payment', 'processing', 'cancelled'],
  awaiting_payment: ['paid', 'failed_payment', 'cancelled'],
  paid: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'delivered', 'completed', 'cancelled'],
  shipped: ['delivered', 'completed'],
  delivered: [],
  cancelled: [],
  failed_payment: ['awaiting_payment', 'cancelled'],
  completed: [],
};

export const OrderStatuses = Object.freeze({
  pending: 'pending',
  awaiting_payment: 'awaiting_payment',
  paid: 'paid',
  processing: 'processing',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  failed_payment: 'failed_payment',
  completed: 'completed',
});

export function canTransition(current, next) {
  if (!current || !next) return false;
  if (current === next) return true;
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

export async function transitionProductOrder({
  orderId,
  targetStatus,
  reason = null,
  actorType = 'system',
  actorId = null,
  prismaClient = prisma,
}) {
  if (!orderId) {
    throw new Error('orderId is required for transition');
  }

  const order = await prismaClient.productOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error(`Product order ${orderId} not found`);
  }

  if (order.status === targetStatus) {
    await createStatusEvent(prismaClient, {
      product_order_id: order.id,
      from_status: order.status,
      to_status: targetStatus,
      reason: reason || 'status-unchanged',
      actor_type: actorType,
      actor_id: actorId,
    });
    return order;
  }

  if (!canTransition(order.status, targetStatus)) {
    throw new Error(`Invalid status transition: ${order.status} -> ${targetStatus}`);
  }

  // Helper function to perform the update operations
  const performUpdate = async (client) => {
    const updatedOrder = await client.productOrder.update({
      where: { id: order.id },
      data: {
        status: targetStatus,
        updated_at: new Date(),
      },
    });

    await createStatusEvent(client, {
      product_order_id: order.id,
      from_status: order.status,
      to_status: targetStatus,
      reason: reason || 'state-machine',
      actor_type: actorType,
      actor_id: actorId,
    });

    return updatedOrder;
  };

  // If prismaClient is explicitly passed (not the default prisma), 
  // assume it's a transaction client and use it directly
  // This works because transaction clients are different object instances
  if (prismaClient !== prisma) {
    // Already in a transaction, use the client directly
    return await performUpdate(prismaClient);
  }

  // Not in a transaction, create one
  try {
    return await prismaClient.$transaction(async (tx) => {
      return await performUpdate(tx);
    });
  } catch (transactionError) {
    // If transaction fails due to nested transaction, try without transaction
    // This shouldn't happen, but provides a fallback
    if (transactionError.message?.includes('transaction') || 
        transactionError.code === 'P2034') {
      console.warn('[ORDER_STATE_MACHINE] Transaction error, attempting direct update:', transactionError.message);
      return await performUpdate(prismaClient);
    }
    throw transactionError;
  }
}

async function createStatusEvent(tx, data) {
  try {
    await tx.orderStatusEvent.create({
      data: {
        ...data,
      },
    });
  } catch (err) {
    console.error('[ORDER_STATE_MACHINE] Failed to create status event', {
      error: err.message,
      data,
    });
    throw err;
  }
}

