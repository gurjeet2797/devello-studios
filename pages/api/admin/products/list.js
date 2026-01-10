import { verifyAdminAccess } from '../../../../lib/adminAuth';
import prismaClient from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[ADMIN_PRODUCTS_LIST] Prisma client is not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;

  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(req);
    if (!authResult.isAdmin) {
      return res.status(401).json({ error: authResult.error || 'Unauthorized' });
    }

    const { status, productType, page = 1, limit = 100 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      status: status === 'all' ? undefined : status,
      product_type: productType || undefined,
    };

    // Remove undefined values
    Object.keys(where).forEach(key => where[key] === undefined && delete where[key]);

    // Get products from both tables
    const [regularProducts, houseBuildProducts, regularTotal, houseBuildTotal] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      prisma.houseBuildProduct?.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }) || Promise.resolve([]),
      prisma.product.count({ where }),
      prisma.houseBuildProduct?.count({ where }) || Promise.resolve(0),
    ]);

    // Combine products
    const allProducts = [...regularProducts, ...houseBuildProducts];
    const total = regularTotal + houseBuildTotal;

    return res.status(200).json({
      success: true,
      products: allProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[ADMIN_PRODUCTS_LIST] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
    });
  }
}
