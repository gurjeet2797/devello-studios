import { requireAdmin } from '../../../lib/adminAuth';
import prisma from '../../../lib/prisma';
import { StripeTransactionService } from '../../../lib/stripeTransactionService';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Starting Stripe transaction sync...');
    
    // Fetch all transactions from Stripe
    const stripeTransactions = await StripeTransactionService.syncAllTransactions();
    
    console.log(`📊 Processing ${stripeTransactions.length} transactions...`);
    
    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each transaction
    for (const transaction of stripeTransactions) {
      try {
        // Check if transaction already exists
        const existing = await prisma.stripeTransaction.findUnique({
          where: {
            stripe_transaction_id: transaction.stripe_transaction_id
          }
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        // Try to find user by email or customer ID
        let user = null;
        if (transaction.user_email) {
          user = await prisma.user.findUnique({
            where: { email: transaction.user_email }
          });
        }

        if (!user && transaction.stripe_customer_id) {
          // Try to find user by Stripe customer ID in subscription
          const subscription = await prisma.subscription.findUnique({
            where: { stripe_customer_id: transaction.stripe_customer_id },
            include: { user: true }
          });
          if (subscription) {
            user = subscription.user;
          }
        }

        // Create transaction record
        await prisma.stripeTransaction.create({
          data: {
            stripe_transaction_id: transaction.stripe_transaction_id,
            stripe_payment_intent_id: transaction.stripe_payment_intent_id,
            stripe_session_id: transaction.stripe_session_id,
            stripe_charge_id: transaction.stripe_charge_id,
            stripe_customer_id: transaction.stripe_customer_id,
            stripe_subscription_id: transaction.stripe_subscription_id,
            amount: transaction.amount,
            currency: transaction.currency,
            status: transaction.status,
            transaction_type: transaction.transaction_type,
            description: transaction.description,
            user_id: user?.id,
            user_email: transaction.user_email,
            user_name: user?.profile?.first_name && user?.profile?.last_name 
              ? `${user.profile.first_name} ${user.profile.last_name}`
              : null,
            stripe_metadata: transaction.stripe_metadata,
            stripe_created: transaction.stripe_created,
            stripe_updated: transaction.stripe_updated || null,
            processed: true,
            sync_status: 'synced'
          }
        });

        syncedCount++;
        console.log(`✅ Synced transaction: ${transaction.stripe_transaction_id}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error syncing transaction ${transaction.stripe_transaction_id}:`, error);
      }
    }

    console.log(`🎉 Sync completed! Synced: ${syncedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);

    return res.status(200).json({
      success: true,
      message: 'Stripe transactions synced successfully',
      stats: {
        total: stripeTransactions.length,
        synced: syncedCount,
        skipped: skippedCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('❌ Error in sync-stripe-transactions:', error);
    return res.status(500).json({ 
      error: 'Failed to sync Stripe transactions',
      details: error.message 
    });
  }
}

export default requireAdmin(handler);
