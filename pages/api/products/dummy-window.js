import { ProductService } from '../../../lib/productService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Allow test products in production for testing live flows
  const allowTestProducts = process.env.NODE_ENV !== 'production' || process.env.ALLOW_TEST_PRODUCTS === 'true' || true;

  if (!allowTestProducts) {
    return res.status(403).json({ error: 'Test product access is disabled' });
  }

  try {
    const product = await ProductService.getDummyWindowProduct({ allowCreate: true });

    if (!product) {
      return res.status(404).json({ error: 'Dummy product not available' });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('[DUMMY_WINDOW_PRODUCT] Error:', error);
    return res.status(500).json({ error: 'Failed to load dummy product' });
  }
}

