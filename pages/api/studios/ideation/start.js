/**
 * POST /api/studios/ideation/start
 * 
 * Initiate a new ideation job.
 * Accepts app idea prompt and optional context.
 */

import prismaClient from '../../../../lib/prisma';
import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import { processIdeationJob } from '../../../../lib/ideationJobProcessor';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[IDEATION_START] Prisma client not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;

  try {
    // Get user if authenticated (optional)
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const supabase = createSupabaseAuthClient();
        const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);
        
        if (!authError && supabaseUser) {
          const user = await prisma.user.findUnique({
            where: { supabase_user_id: supabaseUser.id }
          });
          if (user) {
            userId = user.id;
          }
        }
      } catch (error) {
        // Auth is optional, continue without user
        console.log('[IDEATION_START] Auth optional, continuing as guest');
      }
    }

    const { prompt, platform, industry, tone, targetAudience } = req.body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 8) {
      return res.status(400).json({
        error: 'Prompt is required and must be at least 8 characters'
      });
    }

    // Build context object
    const context = {};
    if (platform) context.platform = platform;
    if (industry) context.industry = industry;
    if (tone) context.tone = tone;
    if (targetAudience) context.targetAudience = targetAudience;

    // Create job record
    let job;
    try {
      job = await prisma.ideationJob.create({
        data: {
          status: 'queued',
          progress: 0,
          message: 'Job created, waiting to start...',
          prompt: prompt.trim(),
          context: Object.keys(context).length > 0 ? context : null,
          user_id: userId
        }
      });
    } catch (dbError) {
      console.error('[IDEATION_START] Database error:', dbError);
      return res.status(500).json({
        error: 'Failed to create job',
        details: dbError.message
      });
    }

    console.log(`[IDEATION_START] Created ideation job: ${job.id}`);

    // Process job asynchronously (don't wait for completion)
    processIdeationJob(job.id).catch(error => {
      console.error(`[IDEATION_START] Job ${job.id} processing failed:`, error.message);
    });

    return res.status(200).json({
      success: true,
      ideaId: job.id,
      status: 'queued',
      message: 'Ideation job started'
    });

  } catch (error) {
    console.error('[IDEATION_START] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
