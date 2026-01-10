/*
  Dev reset script: cancels Stripe subs (best-effort) and truncates Supabase (Postgres) tables via Prisma
*/
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run in production');
  }

  const prisma = new PrismaClient();
  const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' }) : null;

  try {
    // Cancel Stripe subscriptions
    if (stripe) {
      const subs = await prisma.subscription.findMany({
        where: { stripe_subscription_id: { not: null } },
        select: { stripe_subscription_id: true }
      });
      for (const s of subs) {
        try {
          await stripe.subscriptions.cancel(s.stripe_subscription_id);
        } catch (e) {
          console.warn('Cancel sub failed', s.stripe_subscription_id, e.message);
        }
      }
    } else {
    }

    // Truncate in safe order
    const queries = [
      'TRUNCATE TABLE "support_messages" RESTART IDENTITY CASCADE',
      'TRUNCATE TABLE "newsletter_subscribers" RESTART IDENTITY CASCADE',
      'TRUNCATE TABLE "guest_purchases" RESTART IDENTITY CASCADE',
      'TRUNCATE TABLE "one_time_purchases" RESTART IDENTITY CASCADE',
      'TRUNCATE TABLE "uploads" RESTART IDENTITY CASCADE',
      'TRUNCATE TABLE "subscriptions" RESTART IDENTITY CASCADE',
      'TRUNCATE TABLE "user_profiles" RESTART IDENTITY CASCADE',
      'TRUNCATE TABLE "users" RESTART IDENTITY CASCADE',
      'TRUNCATE TABLE "Prediction" RESTART IDENTITY CASCADE'
    ];
    for (const q of queries) {
      try {
        await prisma.$executeRawUnsafe(q);
      } catch (e) {
        console.warn('Skip/failed:', q, e.message);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ Dev reset failed', err);
  process.exit(1);
});


