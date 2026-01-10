/**
 * GET /api/admin/product-research/results/[jobId]
 * 
 * Get the full results of a completed product research job.
 */

import { verifyAdminAccess } from '../../../../../lib/adminAuth';
import prismaClient from '../../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[PRODUCT_RESEARCH_RESULTS] Prisma client not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;
  const { jobId } = req.query;

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(req);
    if (!authResult.isAdmin) {
      return res.status(401).json({ error: authResult.error || 'Unauthorized' });
    }

    // Fetch job with results
    const job = await prisma.productResearchJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if job is completed
    if (job.status !== 'completed' && job.status !== 'failed') {
      return res.status(400).json({
        error: 'Job not yet completed',
        status: job.status,
        progress: job.progress,
        message: 'Please poll the status endpoint until the job is complete'
      });
    }

    // Parse results
    const results = job.results || { products: [], errors: [], suggestions: [] };
    
    // Enhance product data with additional computed fields
    const products = (results.products || []).map((product, index) => ({
      ...product,
      _tempId: `temp-${index}`, // Temporary ID for frontend tracking
      _selected: product.confidence >= 0.8, // Auto-select high confidence
      _hasIssues: product.confidence < 0.8 || !product.name || !product.price_cents
    }));

    return res.status(200).json({
      jobId: job.id,
      status: job.status,
      products,
      errors: results.errors || job.errors || [],
      suggestions: results.suggestions || [],
      inputs: job.inputs,
      completedAt: job.completed_at,
      executionTime: results.executionTime,
      model: results.model,
      totalCost: job.total_cost ? parseFloat(job.total_cost) : null,
      costBreakdown: job.cost_breakdown || null
    });

  } catch (error) {
    console.error('[PRODUCT_RESEARCH_RESULTS] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
