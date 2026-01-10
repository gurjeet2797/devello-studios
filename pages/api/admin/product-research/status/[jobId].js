/**
 * GET /api/admin/product-research/status/[jobId]
 * 
 * Get the current status and progress of a product research job.
 */

import { verifyAdminAccess } from '../../../../../lib/adminAuth';
import prismaClient from '../../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[PRODUCT_RESEARCH_STATUS] Prisma client not available');
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

    // Fetch job status
    const job = await prisma.productResearchJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        progress: true,
        message: true,
        errors: true,
        results: true,
        created_at: true,
        started_at: true,
        completed_at: true
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Calculate products found count from results
    let productsFound = 0;
    if (job.results && Array.isArray(job.results.products)) {
      productsFound = job.results.products.length;
    }

    // Calculate elapsed time
    const startTime = job.started_at || job.created_at;
    const endTime = job.completed_at || new Date();
    const elapsedMs = new Date(endTime) - new Date(startTime);
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    return res.status(200).json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      message: job.message,
      productsFound,
      errors: job.errors || [],
      totalCost: job.total_cost ? parseFloat(job.total_cost) : null,
      costBreakdown: job.cost_breakdown || null,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      elapsedSeconds
    });

  } catch (error) {
    console.error('[PRODUCT_RESEARCH_STATUS] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
