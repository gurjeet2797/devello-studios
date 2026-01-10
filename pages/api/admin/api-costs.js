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

    // Get total costs
    const totalCost = await prisma.apiCost.aggregate({
      _sum: { cost: true }
    });

    const dailyCost = await prisma.apiCost.aggregate({
      where: {
        timestamp: {
          gte: today
        }
      },
      _sum: { cost: true }
    });

    const monthlyCost = await prisma.apiCost.aggregate({
      where: {
        timestamp: {
          gte: lastMonth
        }
      },
      _sum: { cost: true }
    });

    // Get costs by service
    const serviceCosts = await prisma.apiCost.groupBy({
      by: ['service'],
      where: {
        timestamp: {
          gte: lastMonth
        }
      },
      _sum: {
        cost: true
      },
      _count: {
        id: true
      }
    });

    // Get recent activity
    const recentActivity = await prisma.apiCost.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    // Format service data
    const services = serviceCosts.map(service => {
      const serviceNames = {
        'google_gemini': 'Google Gemini',
        'replicate': 'Replicate API',
        'supabase': 'Supabase',
        'vercel': 'Vercel',
        'stripe': 'Stripe'
      };

      return {
        name: serviceNames[service.service] || service.service,
        cost: parseFloat(service._sum.cost || 0),
        usage: `${service._count.id} requests`,
        status: 'active',
        trend: 'up', // This would be calculated based on previous period
        change: '+5.2%' // This would be calculated based on previous period
      };
    });

    // Format recent activity
    const formattedActivity = recentActivity.map(activity => ({
      service: activity.service.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      action: 'API Request',
      cost: parseFloat(activity.cost),
      timestamp: activity.timestamp,
      status: 'success'
    }));

    const apiCosts = {
      totalCost: parseFloat(totalCost._sum.cost || 0),
      dailyCost: parseFloat(dailyCost._sum.cost || 0),
      monthlyCost: parseFloat(monthlyCost._sum.cost || 0),
      services,
      recentActivity: formattedActivity
    };

    res.status(200).json(apiCosts);
  } catch (error) {
    console.error('Error fetching API costs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Apply admin authentication middleware
const handlerWithAuth = requireAdmin(handler);
export default handlerWithAuth;
