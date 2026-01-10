import { requireAdmin } from '../../../lib/adminAuth';
import prisma from '../../../lib/prisma';

// Function to calculate subscription revenue based on plan and duration
function calculateSubscriptionRevenue(subscription, userCreatedAt) {
  if (!subscription || subscription.status !== 'active') {
    return 0;
  }

  // Define plan pricing (in cents) - using actual plan prices
  const planPricing = {
    'basic': 599,  // $5.99/month
    'pro': 999,    // $9.99/month
    'free': 0
  };

  const monthlyPrice = planPricing[subscription.plan_type] || 0;
  if (monthlyPrice === 0) return 0;

  // Calculate months since subscription started
  const subscriptionStart = subscription.current_period_start 
    ? new Date(subscription.current_period_start)
    : new Date(userCreatedAt);
  
  const now = new Date();
  const monthsActive = Math.max(1, Math.ceil((now - subscriptionStart) / (1000 * 60 * 60 * 24 * 30)));

  return monthlyPrice * monthsActive;
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { page = 1, limit = 50, search = '', sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause for search
    const whereClause = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { 
          OR: [
            { first_name: { contains: search, mode: 'insensitive' } },
            { last_name: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ]
    } : {};

    // Get users with pagination
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: true,
        subscription: true,
        uploads: {
          select: {
            id: true,
            created_at: true
          }
        },
        one_time_purchases: {
          select: {
            id: true,
            amount: true,
            status: true,
            created_at: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: parseInt(limit)
    });

    // Get total count for pagination
    const totalUsers = await prisma.user.count({
      where: whereClause
    });

    // Format user data
    const formattedUsers = users.map(user => {
      const oneTimeRevenue = user.one_time_purchases.reduce((sum, purchase) => 
        purchase.status === 'completed' ? sum + purchase.amount : sum, 0
      );
      const subscriptionRevenue = calculateSubscriptionRevenue(user.subscription, user.created_at);
      const totalRevenue = oneTimeRevenue + subscriptionRevenue;

      return {
        id: user.id,
        email: user.email,
        name: user.profile?.first_name && user.profile?.last_name 
          ? `${user.profile.first_name} ${user.profile.last_name}`
          : null,
        company: user.profile?.company,
        website: user.profile?.website,
        createdAt: user.created_at,
        subscription: {
          status: user.subscription?.status || 'inactive',
          planType: user.subscription?.plan_type || 'free',
          currentPeriodEnd: user.subscription?.current_period_end
        },
        uploads: {
          count: user.uploads.length,
          limit: user.profile?.upload_limit || 5,
          lastUpload: user.uploads.length > 0 ? user.uploads[0].created_at : null
        },
        purchases: {
          total: user.one_time_purchases.length,
          totalAmount: oneTimeRevenue,
          lastPurchase: user.one_time_purchases.length > 0 ? user.one_time_purchases[0].created_at : null
        },
        revenue: {
          oneTimePurchases: oneTimeRevenue,
          subscriptionRevenue: subscriptionRevenue,
          totalRevenue: totalRevenue
        }
      };
    });

    return res.status(200).json({
      users: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalUsers,
        pages: Math.ceil(totalUsers / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ [ADMIN_USERS] Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users data' });
  }
}

export default requireAdmin(handler);
