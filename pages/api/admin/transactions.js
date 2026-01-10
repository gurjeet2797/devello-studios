import { requireAdmin } from '../../../lib/adminAuth';
import prisma from '../../../lib/prisma';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      sortBy = 'created_at', 
      sortOrder = 'desc',
      status = 'all',
      type = 'all'
    } = req.query;
    const pageInt = Math.max(parseInt(page, 10) || 1, 1);
    const limitInt = Math.max(parseInt(limit, 10) || 50, 1);
    const fetchSize = limitInt * pageInt; // fetch enough to sort and paginate after merge

    // Get Payment records (product orders)
    const payments = await prisma.payment.findMany({
      where: {
        status: 'succeeded'
      },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        productOrder: {
          select: {
            id: true,
            order_number: true,
            order_type: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      take: fetchSize
    });

    console.log('Payments found:', payments.length);

    // Get Stripe transactions
    const stripeTransactions = await prisma.stripeTransaction.findMany({
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      take: fetchSize
    });

    console.log('Stripe transactions found:', stripeTransactions.length);

    // Get one-time purchases (legacy)
    const oneTimePurchases = await prisma.oneTimePurchase.findMany({
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      take: fetchSize
    });

    console.log('One-time purchases found:', oneTimePurchases.length);

    // Get guest purchases (legacy)
    const guestPurchases = await prisma.guestPurchase.findMany({
      orderBy: {
        [sortBy]: sortOrder
      },
      take: fetchSize
    });

    console.log('Guest purchases found:', guestPurchases.length);

    // Format Payment records
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      type: payment.productOrder?.order_type === 'custom_order' ? 'custom_order' : 'product_order',
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      stripePaymentIntentId: payment.stripe_payment_intent_id,
      stripeChargeId: payment.stripe_charge_id,
      createdAt: payment.paid_at || payment.created_at,
      orderNumber: payment.productOrder?.order_number,
      user: {
        name: payment.user?.profile?.first_name && payment.user?.profile?.last_name 
          ? `${payment.user.profile.first_name} ${payment.user.profile.last_name}`
          : null,
        email: payment.user?.email || 'No email',
        id: payment.user_id
      }
    }));

    // Format Stripe transactions
    const formattedStripeTransactions = stripeTransactions.map(transaction => ({
      id: transaction.id,
      type: transaction.transaction_type,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      stripePaymentIntentId: transaction.stripe_payment_intent_id,
      stripeSessionId: transaction.stripe_session_id,
      stripeChargeId: transaction.stripe_charge_id,
      createdAt: transaction.stripe_created || transaction.created_at,
      user: {
        name: transaction.user_name || (transaction.user?.profile?.first_name && transaction.user?.profile?.last_name 
          ? `${transaction.user.profile.first_name} ${transaction.user.profile.last_name}`
          : null),
        email: transaction.user_email || transaction.user?.email || 'No email',
        id: transaction.user_id
      }
    }));

    // Format one-time purchases
    const formattedOneTimePurchases = oneTimePurchases.map(purchase => ({
      id: purchase.id,
      type: 'one_time',
      amount: purchase.amount,
      currency: purchase.currency,
      status: purchase.status,
      stripePaymentIntentId: purchase.stripe_payment_intent_id,
      stripeSessionId: purchase.stripe_session_id,
      createdAt: purchase.created_at,
      user: {
        name: purchase.user?.profile?.first_name && purchase.user?.profile?.last_name 
          ? `${purchase.user.profile.first_name} ${purchase.user.profile.last_name}`
          : null,
        email: purchase.user?.email || 'No email',
        id: purchase.user?.id
      }
    }));

    // Format guest purchases
    const formattedGuestPurchases = guestPurchases.map(purchase => ({
      id: purchase.id,
      type: 'one_time',
      amount: purchase.amount,
      currency: purchase.currency,
      status: purchase.status,
      stripePaymentIntentId: purchase.stripe_payment_intent_id,
      stripeSessionId: purchase.stripe_session_id,
      createdAt: purchase.created_at,
      user: {
        name: 'Guest User',
        email: purchase.user_email || 'No email',
        id: null
      }
    }));

    // Combine all transactions
    const allTransactions = [
      ...formattedPayments,
      ...formattedStripeTransactions,
      ...formattedOneTimePurchases,
      ...formattedGuestPurchases
    ];

    // Sort combined transactions
    const combinedSortKey = sortBy === 'created_at' ? 'createdAt' : sortBy;
    allTransactions.sort((a, b) => {
      const aValue = a[combinedSortKey];
      const bValue = b[combinedSortKey];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination to combined results
    const start = (pageInt - 1) * limitInt;
    const paginatedTransactions = allTransactions.slice(start, start + limitInt);

    // Get total count for pagination
    const totalPayments = await prisma.payment.count({ where: { status: 'succeeded' } });
    const totalStripe = await prisma.stripeTransaction.count();
    const totalOneTime = await prisma.oneTimePurchase.count();
    const totalGuests = await prisma.guestPurchase.count();
    const totalTransactions = totalPayments + totalStripe + totalOneTime + totalGuests;

    console.log('Total transactions:', totalTransactions);
    console.log('Formatted transactions:', paginatedTransactions.length);

    return res.status(200).json({
      transactions: paginatedTransactions,
      pagination: {
        page: pageInt,
        limit: limitInt,
        total: totalTransactions,
        pages: Math.ceil(totalTransactions / limitInt)
      }
    });
  } catch (error) {
    console.error('❌ [ADMIN_TRANSACTIONS] Error fetching transactions:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions data' });
  }
}

export default requireAdmin(handler);
