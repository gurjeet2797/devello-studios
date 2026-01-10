import { verifyAdminAccess } from '../../../../lib/adminAuth';
import prismaClient from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[ADMIN_PRODUCT_CREATE] Prisma client is not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;

  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(req);
    if (!authResult.isAdmin) {
      return res.status(401).json({ error: authResult.error || 'Unauthorized' });
    }

    const {
      name,
      description,
      slug,
      price,
      currency = 'usd',
      stripe_price_id,
      product_type = 'one_time',
      status = 'active',
      is_test = false,
      visible_in_catalog = true,
      image_url,
      metadata,
      shippingProfile,
      table = 'products' // 'products' or 'house_build_products'
    } = req.body;

    // Validate required fields
    if (!name || !slug || price === undefined) {
      return res.status(400).json({ error: 'Name, slug, and price are required' });
    }

    const productData = {
      name,
      description,
      slug,
      price: parseInt(price),
      currency,
      stripe_price_id,
      product_type,
      status,
      is_test,
      visible_in_catalog,
      image_url,
      metadata: metadata ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata) : null,
      ...(table === 'products' && shippingProfile ? { shippingProfile } : {}),
    };

    let product;
    if (table === 'products') {
      product = await prisma.product.create({ data: productData });
    } else {
      product = await prisma.houseBuildProduct.create({ data: productData });
    }

    return res.status(201).json({ product });
  } catch (error) {
    console.error('[ADMIN_PRODUCT_CREATE] Error:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Product with this slug already exists' });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
    });
  }
}
