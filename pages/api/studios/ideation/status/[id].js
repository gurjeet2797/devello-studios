/**
 * GET /api/studios/ideation/status/:id
 * 
 * Get the status of an ideation job.
 */

import prismaClient from '../../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[IDEATION_STATUS] Prisma client not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  try {
    const job = await prisma.ideationJob.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        progress: true,
        message: true,
        created_at: true,
        started_at: true,
        completed_at: true
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.status(200).json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      message: job.message,
      created_at: job.created_at,
      started_at: job.started_at,
      completed_at: job.completed_at
    });

  } catch (error) {
    console.error('[IDEATION_STATUS] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
