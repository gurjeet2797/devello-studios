import { verifyAdminAccess } from '../../../../lib/adminAuth';
import prismaClient from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (!prismaClient) {
    console.error('[ADMIN_PRODUCT] Prisma client is not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;

  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(req);
    if (!authResult.isAdmin) {
      return res.status(401).json({ error: authResult.error || 'Unauthorized' });
    }

    const { id } = req.query;

    if (req.method === 'GET') {
      // Get single product
      let product = await prisma.product.findUnique({ where: { id } });
      
      if (!product) {
        product = await prisma.houseBuildProduct.findUnique({ where: { id } });
      }

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.status(200).json({ product });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      // Update product
      const updateData = req.body;

      // Try to update in products table first
      let product = await prisma.product.findUnique({ where: { id } });
      let updatedProduct;

      if (product) {
        updatedProduct = await prisma.product.update({
          where: { id },
          data: updateData,
        });
      } else {
        // Try house_build_products table
        product = await prisma.houseBuildProduct.findUnique({ where: { id } });
        if (product) {
          updatedProduct = await prisma.houseBuildProduct.update({
            where: { id },
            data: updateData,
          });
        } else {
          return res.status(404).json({ error: 'Product not found' });
        }
      }

      return res.status(200).json({ product: updatedProduct });
    }

    if (req.method === 'DELETE') {
      // Delete product
      let product = await prisma.product.findUnique({ where: { id } });

      if (product) {
        await prisma.product.delete({ where: { id } });
      } else {
        product = await prisma.houseBuildProduct.findUnique({ where: { id } });
        if (product) {
          await prisma.houseBuildProduct.delete({ where: { id } });
        } else {
          return res.status(404).json({ error: 'Product not found' });
        }
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[ADMIN_PRODUCT] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
    });
  }
}
