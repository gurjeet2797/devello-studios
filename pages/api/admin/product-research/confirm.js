/**
 * POST /api/admin/product-research/confirm
 * 
 * Confirm and import selected products from a research job into the catalog.
 */

import { verifyAdminAccess } from '../../../../lib/adminAuth';
import prismaClient from '../../../../lib/prisma';

/**
 * Generate a unique slug from a product name
 */
function generateSlug(name, existingSlugs = []) {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Validate product data before import
 */
function validateProduct(product) {
  const errors = [];
  
  if (!product.name || product.name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters');
  }
  
  if (typeof product.price_cents !== 'number' || product.price_cents < 0) {
    errors.push('Price must be a non-negative number in cents');
  }
  
  if (product.name && product.name.length > 200) {
    errors.push('Name must be less than 200 characters');
  }
  
  return errors;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[PRODUCT_RESEARCH_CONFIRM] Prisma client not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;

  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(req);
    if (!authResult.isAdmin) {
      return res.status(401).json({ error: authResult.error || 'Unauthorized' });
    }

    const { jobId, products } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'At least one product is required' });
    }

    console.log(`[PRODUCT_RESEARCH_CONFIRM] Importing ${products.length} products from job ${jobId}`);

    // Verify job exists
    const job = await prisma.productResearchJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get existing slugs to avoid conflicts
    const existingProducts = await prisma.product.findMany({
      select: { slug: true }
    });
    const existingSlugs = existingProducts.map(p => p.slug);

    const importResults = {
      success: [],
      failed: [],
      productIds: []
    };

    // Process each product
    for (const product of products) {
      // Validate
      const validationErrors = validateProduct(product);
      if (validationErrors.length > 0) {
        importResults.failed.push({
          name: product.name || 'Unknown',
          errors: validationErrors
        });
        continue;
      }

      try {
        // Generate unique slug
        const slug = generateSlug(product.name, [...existingSlugs, ...importResults.success.map(p => p.slug)]);
        
        // Get options from job inputs
        const options = job.inputs?.options || {};
        const isTest = options.markAsTest || false;
        
        // Prepare product data matching the schema from create.js
        const productData = {
          name: product.name.trim(),
          description: product.description || null,
          slug,
          price: product.price_cents || 0,
          currency: 'usd',
          product_type: 'one_time',
          status: 'active',
          is_test: isTest,
          visible_in_catalog: !isTest,
          image_url: product.images?.[0] || null,
          metadata: {
            category: product.category || options.category || 'uncategorized',
            productId: product.productId || null,
            variants: product.variants || [],
            highlights: product.highlights || [],
            referenceSize: product.referenceSize || null,
            pricingNotes: product.pricingNotes || null,
            sources: product.sources || [],
            confidence: product.confidence || null,
            importedFrom: {
              jobId,
              timestamp: new Date().toISOString()
            }
          }
        };

        // Create product
        const createdProduct = await prisma.product.create({
          data: productData
        });

        importResults.success.push({
          id: createdProduct.id,
          name: createdProduct.name,
          slug: createdProduct.slug
        });
        importResults.productIds.push(createdProduct.id);

        console.log(`[PRODUCT_RESEARCH_CONFIRM] Created product: ${createdProduct.name} (${createdProduct.slug})`);

      } catch (error) {
        console.error(`[PRODUCT_RESEARCH_CONFIRM] Failed to create product ${product.name}:`, error.message);
        
        let errorMessage = error.message;
        if (error.code === 'P2002') {
          errorMessage = 'A product with this slug already exists';
        }
        
        importResults.failed.push({
          name: product.name,
          errors: [errorMessage]
        });
      }
    }

    // Update job with import results
    await prisma.productResearchJob.update({
      where: { id: jobId },
      data: {
        results: {
          ...job.results,
          importResults: {
            importedCount: importResults.success.length,
            failedCount: importResults.failed.length,
            productIds: importResults.productIds,
            timestamp: new Date().toISOString()
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      importedCount: importResults.success.length,
      failedCount: importResults.failed.length,
      productIds: importResults.productIds,
      imported: importResults.success,
      failed: importResults.failed
    });

  } catch (error) {
    console.error('[PRODUCT_RESEARCH_CONFIRM] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
