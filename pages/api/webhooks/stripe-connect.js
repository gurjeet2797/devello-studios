import { buffer } from 'micro';
import { StripeConnectService } from '../../../lib/stripeConnectService';
import prisma from '../../../lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_CONNECT_WEBHOOK_SECRET);
    
    console.log('Stripe Connect webhook received:', {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000).toISOString()
    });
  } catch (err) {
    console.error('❌ [STRIPE_CONNECT_WEBHOOK] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
      
      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event.data.object);
        break;
      
      case 'payout.paid':
        await handlePayoutPaid(event.data.object);
        break;
      
      case 'payout.failed':
        await handlePayoutFailed(event.data.object);
        break;
      
      default:
        console.log('Unhandled event type:', event.type);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ [STRIPE_CONNECT_WEBHOOK] Handler error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleAccountUpdated(account) {
  try {
    console.log('Account updated:', {
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });

    // Update account status
    await StripeConnectService.updateAccountStatus(
      account.id,
      account.charges_enabled && account.payouts_enabled ? 'active' : 'pending'
    );

    console.log('Account status updated');
  } catch (error) {
    console.error('Error handling account updated:', error);
  }
}

async function handleAccountDeauthorized(account) {
  try {
    console.log('Account deauthorized:', {
      accountId: account.id,
    });

    // Update account status to restricted
    await StripeConnectService.updateAccountStatus(account.id, 'restricted');

    console.log('Account status updated to restricted');
  } catch (error) {
    console.error('Error handling account deauthorized:', error);
  }
}

async function handlePayoutPaid(payout) {
  try {
    console.log('Payout paid:', {
      payoutId: payout.id,
      accountId: payout.destination,
      amount: payout.amount,
      currency: payout.currency,
    });

    // TODO: Track payout in database if needed
    // You might want to create a Payout model to track partner payouts

    console.log('Payout tracked');
  } catch (error) {
    console.error('Error handling payout paid:', error);
  }
}

async function handlePayoutFailed(payout) {
  try {
    console.log('Payout failed:', {
      payoutId: payout.id,
      accountId: payout.destination,
      amount: payout.amount,
      failureCode: payout.failure_code,
      failureMessage: payout.failure_message,
    });

    // TODO: Notify partner of failed payout
    // You might want to send an email notification

    console.log('Payout failure logged');
  } catch (error) {
    console.error('Error handling payout failed:', error);
  }
}

