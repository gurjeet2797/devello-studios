/**
 * GET /api/studios/ideation/result/:id
 * 
 * Get ideation job result with progressive loading support.
 * 
 * Returns partial results while job is processing so the frontend
 * can show the concept immediately while images generate in background.
 * 
 * Response includes:
 * - status: queued | processing | completed | failed
 * - progress: 0-100
 * - result: The concept data (available once progress >= 35)
 * - extended: Research, screens, images when available
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
        errors: true,
        total_cost: true,
        created_at: true,
        completed_at: true
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const result = job.result || {};

    // Build response based on status
    const response = {
      id: job.id,
      status: job.status,
      progress: job.progress,
      message: job.message,
      
      // Flags for frontend
      hasResult: !!result.name,
      isComplete: job.status === 'completed',
      hasImages: !!(result._images?.some(i => i.success)),
      hasMockup: !!result._mockup
    };

    // Include result if available (progress >= 35 means concept is ready)
    if (result.name) {
      response.result = {
        name: result.name,
        tagline: result.tagline,
        description: result.description || result.tagline
      };
    }

    // Include extended data for completed jobs
    if (job.status === 'completed') {
      if (result._research) response.research = result._research;
      if (result._screens) response.screens = result._screens;
      if (result._mockup) response.mockup = result._mockup;
      if (result._showcase) response.showcase = result._showcase;
    }

    // Include errors if failed
    if (job.status === 'failed') {
      response.error = job.message;
      response.errors = job.errors;
    }

    // Metadata for completed jobs
    if (job.status === 'completed') {
      response.cost = job.total_cost;
      response.completed_at = job.completed_at;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('[IDEATION_RESULT] Error:', error);
    return res.status(500).json({ error: 'Internal error', message: error.message });
  }
}
