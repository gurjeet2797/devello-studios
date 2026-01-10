import { requireAdmin } from '../../../lib/adminAuth';
import prisma from '../../../lib/prisma';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { period = 'daily' } = req.query;
    
    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get user statistics
    const totalUsers = await prisma.user.count();
    const newUsersToday = await prisma.user.count({
      where: {
        created_at: {
          gte: today
        }
      }
    });
    const newUsersYesterday = await prisma.user.count({
      where: {
        created_at: {
          gte: yesterday,
          lt: today
        }
      }
    });
    const newUsersLastWeek = await prisma.user.count({
      where: {
        created_at: {
          gte: lastWeek
        }
      }
    });

    // Get subscription statistics
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: 'active'
      }
    });
    const freeUsers = await prisma.user.count({
      where: {
        subscription: {
          status: 'inactive'
        }
      }
    });

    // Get upload statistics
    const totalUploads = await prisma.upload.count();
    const uploadsToday = await prisma.upload.count({
      where: {
        created_at: {
          gte: today
        }
      }
    });
    const uploadsYesterday = await prisma.upload.count({
      where: {
        created_at: {
          gte: yesterday,
          lt: today
        }
      }
    });

    // Get revenue statistics - one-time purchases
    const totalOneTimeRevenue = await prisma.oneTimePurchase.aggregate({
      where: {
        status: 'completed'
      },
      _sum: {
        amount: true
      }
    });

    // Get subscription revenue
    const activeSubscriptionsData = await prisma.subscription.findMany({
      where: {
        status: 'active'
      },
      include: {
        user: true
      }
    });

    // Calculate subscription revenue
    const subscriptionRevenue = activeSubscriptionsData.reduce((total, sub) => {
      const planPricing = {
        'basic': 599,  // $5.99/month
        'pro': 999,    // $9.99/month
        'free': 0
      };
      
      const monthlyPrice = planPricing[sub.plan_type] || 0;
      if (monthlyPrice === 0) return total;

      const subscriptionStart = sub.current_period_start 
        ? new Date(sub.current_period_start)
        : new Date(sub.user.created_at);
      
      const now = new Date();
      const monthsActive = Math.max(1, Math.ceil((now - subscriptionStart) / (1000 * 60 * 60 * 24 * 30)));
      
      return total + (monthlyPrice * monthsActive);
    }, 0);

    const totalRevenue = {
      _sum: {
        amount: (totalOneTimeRevenue._sum.amount || 0) + subscriptionRevenue
      }
    };

    const revenueToday = await prisma.oneTimePurchase.aggregate({
      where: {
        status: 'completed',
        created_at: {
          gte: today
        }
      },
      _sum: {
        amount: true
      }
    });

    const revenueYesterday = await prisma.oneTimePurchase.aggregate({
      where: {
        status: 'completed',
        created_at: {
          gte: yesterday,
          lt: today
        }
      },
      _sum: {
        amount: true
      }
    });

    // Get monthly upload trends for chart
    const monthlyUploads = await prisma.upload.groupBy({
      by: ['created_at'],
      where: {
        created_at: {
          gte: lastMonth
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    // Get recent transactions
    const recentTransactions = await prisma.oneTimePurchase.findMany({
      where: {
        status: 'completed'
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10
    });

    // Calculate percentage changes
    const userGrowthPercent = newUsersYesterday > 0 
      ? ((newUsersToday - newUsersYesterday) / newUsersYesterday * 100).toFixed(1)
      : newUsersToday > 0 ? 100 : 0;

    const uploadGrowthPercent = uploadsYesterday > 0 
      ? ((uploadsToday - uploadsYesterday) / uploadsYesterday * 100).toFixed(1)
      : uploadsToday > 0 ? 100 : 0;

    const revenueGrowthPercent = revenueYesterday._sum.amount > 0 
      ? ((revenueToday._sum.amount - revenueYesterday._sum.amount) / revenueYesterday._sum.amount * 100).toFixed(1)
      : revenueToday._sum.amount > 0 ? 100 : 0;

    const response = {
      stats: {
        newUsersToday,
        totalUsers,
        uploadsToday,
        nonUsers: freeUsers,
        userGrowthPercent: parseFloat(userGrowthPercent),
        uploadGrowthPercent: parseFloat(uploadGrowthPercent),
        revenueGrowthPercent: parseFloat(revenueGrowthPercent)
      },
      revenue: {
        today: revenueToday._sum.amount || 0,
        total: totalRevenue._sum.amount || 0
      },
      subscriptions: {
        active: activeSubscriptions,
        free: freeUsers
      },
      charts: {
        monthlyUploads: monthlyUploads.map(item => ({
          date: item.created_at,
          count: item._count.id
        }))
      },
      recentTransactions: recentTransactions.map(transaction => ({
        id: transaction.id,
        user: {
          name: transaction.user.profile?.first_name && transaction.user.profile?.last_name 
            ? `${transaction.user.profile.first_name} ${transaction.user.profile.last_name}`
            : transaction.user.email,
          email: transaction.user.email,
          initial: (transaction.user.profile?.first_name || transaction.user.email).charAt(0).toUpperCase()
        },
        amount: transaction.amount,
        currency: transaction.currency,
        date: transaction.created_at,
        status: transaction.status
      }))
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ [ADMIN_ANALYTICS] Error fetching analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
}

export default requireAdmin(handler);
