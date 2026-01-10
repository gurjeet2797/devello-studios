import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { status = 'active', productType, page = 1, limit = 20, includeTest } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Allow test products in production if visible_in_catalog is true (for dummy window testing)
    // In production, show test products if visible_in_catalog is true
    // In dev, show all products if includeTest is true
    const isProduction = process.env.NODE_ENV === 'production';
    const allowTestProducts = includeTest === 'true' || !isProduction;
    
    const where = {
      status: status === 'all' ? undefined : status,
      product_type: productType || undefined,
      // Don't filter by is_test or visible_in_catalog here - we'll filter in memory
      // This allows us to show test products with visible_in_catalog: true in production
    };

    // Remove undefined values
    Object.keys(where).forEach(key => where[key] === undefined && delete where[key]);

    // Query from both products (windows/doors/glass/mirrors) and house_build_products tables
    // Get all products first, then paginate in memory for proper sorting
    const [regularProducts, houseBuildProducts, regularTotal, houseBuildTotal] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { created_at: 'desc' },
      }),
      prisma.houseBuildProduct?.findMany({
        where,
        orderBy: { created_at: 'desc' },
      }) || Promise.resolve([]),
      prisma.product.count({ where }),
      prisma.houseBuildProduct?.count({ where }) || Promise.resolve(0),
    ]);

    // Combine products from both tables and sort by created_at
    const allProducts = [...regularProducts, ...houseBuildProducts];
    allProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Apply manual filter
    // In production: show non-test products OR test products with visible_in_catalog: true
    // In dev: show all if allowTestProducts is true
    const filteredProducts = allProducts.filter(product => {
      // Allow dummy products if they have visible_in_catalog: true (for testing)
      const name = (product.name || '').toLowerCase();
      const slug = (product.slug || '').toLowerCase();
      const isDummy = name.includes('dummy') || slug.includes('dummy');
      
      if (isDummy) {
        // Only show dummy products if they're explicitly marked as visible
        return product.visible_in_catalog === true;
      }
      
      if (isProduction && !allowTestProducts) {
        // Production: exclude test products unless visible_in_catalog is true
        if (product.is_test === true && product.visible_in_catalog !== true) {
          return false;
        }
        // Exclude products explicitly marked as not visible
        if (product.visible_in_catalog === false) {
          return false;
        }
      } else if (!allowTestProducts) {
        // Dev without allowTestProducts: exclude test products
        if (product.is_test === true) {
          return false;
        }
      }
      return true;
    });
    
    // Apply pagination
    const total = filteredProducts.length;
    const products = filteredProducts.slice(skip, skip + take);

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error listing products:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

