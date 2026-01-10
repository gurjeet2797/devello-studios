#!/usr/bin/env node

// CommonJS script to grant a one-time upload credit using Prisma directly

const { PrismaClient } = require('@prisma/client');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const val = args[i + 1];
    if (!key || !key.startsWith('--')) continue;
    out[key.substring(2)] = val;
  }
  return out;
}

(async () => {
  const prisma = new PrismaClient();
  try {
    const {
      email,
      userId: userIdArg,
      paymentIntentId,
      amount = '99',
      currency = 'usd',
      purchaseType = 'single_upload',
      credits = '1',
      sessionId
    } = parseArgs();

    if (!paymentIntentId) {
      throw new Error('Missing required --paymentIntentId');
    }

    let userId = userIdArg;
    if (!userId) {
      if (!email) {
        throw new Error('Provide either --userId or --email');
      }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new Error(`User not found for email: ${email}`);
      }
      userId = user.id;
    }

    const numericAmount = Number(amount);
    const numericCredits = parseInt(credits, 10);

    const existing = await prisma.oneTimePurchase.findUnique({
      where: { stripe_payment_intent_id: paymentIntentId }
    });

    if (existing) {
      await prisma.oneTimePurchase.update({
        where: { stripe_payment_intent_id: paymentIntentId },
        data: {
          status: 'completed',
          amount: isNaN(numericAmount) ? existing.amount : numericAmount,
          currency: currency || existing.currency,
          purchase_type: purchaseType || existing.purchase_type,
          uploads_granted: isNaN(numericCredits) ? existing.uploads_granted : numericCredits,
          stripe_session_id: sessionId || existing.stripe_session_id
        }
      });
    } else {
      await prisma.oneTimePurchase.create({
        data: {
          user_id: userId,
          stripe_payment_intent_id: paymentIntentId,
          stripe_session_id: sessionId || null,
          amount: isNaN(numericAmount) ? 0 : numericAmount,
          currency: currency || 'usd',
          status: 'completed',
          purchase_type: purchaseType || 'single_upload',
          uploads_granted: isNaN(numericCredits) ? 1 : numericCredits,
          uploads_used: 0
        }
      });
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    try { await prisma.$disconnect(); } catch {}
  }
})();


