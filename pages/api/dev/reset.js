import { StripeService } from '../../../lib/stripeService';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Forbidden outside development' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cancelStripe = false } = req.query;

    // Cancel all active Stripe subscriptions (optional)
    if (cancelStripe) {
      const usersWithSubs = await prisma.subscription.findMany({
        where: { stripe_subscription_id: { not: null } },
        select: { stripe_subscription_id: true }
      });
      for (const s of usersWithSubs) {
        try {
          await StripeService.cancelSubscription(s.stripe_subscription_id);
        } catch (e) {
          // best-effort
        }
      }
    }

    // Truncate data tables (respect FKs by order)
    // Order: dependent -> parents
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "support_messages" RESTART IDENTITY CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "newsletter_subscribers" RESTART IDENTITY CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "guest_purchases" RESTART IDENTITY CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "one_time_purchases" RESTART IDENTITY CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "uploads" RESTART IDENTITY CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "subscriptions" RESTART IDENTITY CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "user_profiles" RESTART IDENTITY CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Prediction" RESTART IDENTITY CASCADE');

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Reset failed:', error);
    return res.status(500).json({ error: 'Reset failed', details: error.message });
  }
}


