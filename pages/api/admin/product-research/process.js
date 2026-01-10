/**
 * POST /api/admin/product-research/process
 * 
 * Internal endpoint to trigger job processing.
 * Can be called after job creation or via cron for stuck jobs.
 */

import { verifyAdminAccess } from '../../../../lib/adminAuth';
import { processJob, processQueuedJobs } from '../../../../lib/jobProcessor';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Allow internal calls without full auth check
    const isInternalCall = req.headers['x-internal-call'] === 'true';
    
    if (!isInternalCall) {
      // Verify admin access for external calls
      const authResult = await verifyAdminAccess(req);
      if (!authResult.isAdmin) {
        return res.status(401).json({ error: authResult.error || 'Unauthorized' });
      }
    }

    const { jobId } = req.body;

    if (jobId) {
      // Process specific job
      console.log(`[PRODUCT_RESEARCH_PROCESS] Processing job: ${jobId}`);
      
      // Process asynchronously - don't wait for completion
      processJob(jobId).catch(error => {
        console.error(`[PRODUCT_RESEARCH_PROCESS] Job ${jobId} failed:`, error.message);
      });
      
      return res.status(200).json({
        success: true,
        message: 'Job processing started',
        jobId
      });
      
    } else {
      // Process next queued job
      console.log('[PRODUCT_RESEARCH_PROCESS] Processing queued jobs...');
      
      const result = await processQueuedJobs();
      
      return res.status(200).json({
        success: true,
        ...result
      });
    }

  } catch (error) {
    console.error('[PRODUCT_RESEARCH_PROCESS] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
