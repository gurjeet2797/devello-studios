/**
 * GET /api/studios/ideation/result/:id
 * 
 * Get the result of a completed ideation job.
 */

import prismaClient from '../../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[IDEATION_RESULT] Prisma client not available');
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
        result: true,
        errors: true,
        message: true
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status === 'completed') {
      return res.status(200).json({
        id: job.id,
        status: job.status,
        result: job.result,
        message: job.message
      });
    }

    if (job.status === 'failed') {
      return res.status(200).json({
        id: job.id,
        status: job.status,
        error: job.message || 'Generation failed',
        errors: job.errors
      });
    }

    // Job is still processing
    return res.status(200).json({
      id: job.id,
      status: job.status,
      message: job.message || 'Job is still processing'
    });

  } catch (error) {
    console.error('[IDEATION_RESULT] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
