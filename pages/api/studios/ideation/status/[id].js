/**
 * GET /api/studios/ideation/status/:id
 * 
 * Get job status with stage information.
 * Designed for polling - lightweight response.
 * 
 * Frontend should:
 * 1. Poll this every 1s
 * 2. When hasResult=true, call /result to get the concept
 * 3. Continue polling until isComplete=true for full result
 */

import prismaClient from '../../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    return res.status(500).json({ error: 'Database not available' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Job ID required' });
  }

  try {
    const job = await prismaClient.ideationJob.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        progress: true,
        message: true,
        result: true,
        created_at: true,
        started_at: true,
        completed_at: true
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Determine current stage from progress
    const stage = getStage(job.progress);
    
    // Calculate ETA
    let eta = null;
    if (job.status === 'processing' && job.started_at && job.progress > 0) {
      const elapsed = Date.now() - new Date(job.started_at).getTime();
      const total = (elapsed / job.progress) * 100;
      eta = Math.max(0, Math.round((total - elapsed) / 1000));
    }

    // Check if result is available for display
    const hasResult = !!(job.result?.name);

    return res.status(200).json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      message: job.message,
      stage,
      eta_seconds: eta,
      
      // Flags for frontend
      hasResult,
      isComplete: job.status === 'completed',
      isFailed: job.status === 'failed',
      
      // Timestamps
      created_at: job.created_at,
      started_at: job.started_at,
      completed_at: job.completed_at
    });

  } catch (error) {
    console.error('[IDEATION_STATUS] Error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}

function getStage(progress) {
  if (progress < 35) return 'concept';
  if (progress < 50) return 'research';
  if (progress < 65) return 'screens';
  if (progress < 78) return 'prompts';
  if (progress < 92) return 'images';
  if (progress < 100) return 'mockup';
  return 'complete';
}
