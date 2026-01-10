const processedEvents = new Set();

/**
 * Centralized Stripe event dispatcher with lightweight idempotency.
 * - In-memory guard for duplicate deliveries in same runtime.
 * - Optional DB guard via idempotencyCheck(event, prisma) → boolean.
 *
 * @param {object} params
 * @param {object} params.event Raw Stripe event
 * @param {object} params.prisma Prisma client
 * @param {Record<string, { handler: Function, idempotencyCheck?: Function }>} params.handlers
 */
export async function dispatchStripeEvent({ event, prisma, handlers }) {
  if (!event?.id || !event?.type) {
    console.warn('[STRIPE_WEBHOOK] Received event without id/type');
    return;
  }

  const handlerEntry = handlers[event.type];
  if (!handlerEntry?.handler) {
    console.log('ℹ️ [STRIPE_WEBHOOK] Unhandled event type:', event.type);
    return;
  }

  // In-memory guard
  if (processedEvents.has(event.id)) {
    console.log('[STRIPE_WEBHOOK] Skipping already processed event (memory):', event.id);
    return;
  }

  // Optional DB guard
  if (handlerEntry.idempotencyCheck) {
    const alreadyHandled = await handlerEntry.idempotencyCheck(event, prisma);
    if (alreadyHandled) {
      console.log('[STRIPE_WEBHOOK] Skipping already processed event (db):', {
        eventId: event.id,
        type: event.type,
      });
      processedEvents.add(event.id);
      return;
    }
  }

  await handlerEntry.handler(event.data?.object, event);
  processedEvents.add(event.id);
}

/**
 * Helper to check if a payment intent is already recorded (product order or payment).
 */
export async function isPaymentIntentHandled(intentId, prisma) {
  if (!intentId) return false;
  const order = await prisma.productOrder.findFirst({
    where: { stripe_payment_intent_id: intentId },
    select: { id: true },
  });
  if (order) return true;
  const payment = await prisma.payment.findFirst({
    where: { stripe_payment_intent_id: intentId },
    select: { id: true },
  });
  return !!payment;
}

/**
 * Helper to check if a checkout session is already recorded (by session id or intent id).
 */
export async function isCheckoutSessionHandled(sessionId, intentId, prisma) {
  const whereClauses = [];
  if (sessionId) whereClauses.push({ stripe_session_id: sessionId });
  if (intentId) whereClauses.push({ stripe_payment_intent_id: intentId });
  if (whereClauses.length === 0) return false;

  const order = await prisma.productOrder.findFirst({
    where: { OR: whereClauses },
    select: { id: true },
  });
  return !!order;
}
