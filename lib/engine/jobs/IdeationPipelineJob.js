/**
 * Ideation Pipeline Job
 * 
 * Handles database-backed job processing with progressive result saving.
 * Results are saved after each major stage so users can see progress.
 */

import prismaClient from '../../prisma.js';
import { runIdeationPipeline } from '../runners/PipelineRunner.js';

/**
 * Process an ideation job
 */
export async function processIdeationPipelineJob(jobId) {
  const prisma = prismaClient;
  if (!prisma) throw new Error('Database not available');

  console.log(`[PIPELINE_JOB] Starting job ${jobId}`);

  const job = await prisma.ideationJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('Job not found');
  if (job.status !== 'queued') {
    console.log(`[PIPELINE_JOB] Job ${jobId} already ${job.status}`);
    return;
  }

  // Mark as processing
  await prisma.ideationJob.update({
    where: { id: jobId },
    data: {
      status: 'processing',
      progress: 5,
      message: 'Whispering to the machines...',
      started_at: new Date()
    }
  });

  try {
    const pipelineResult = await runIdeationPipeline(
      {
        idea: job.prompt,
        context: job.context || {}
      },
      {
        jobId,
        requestId: jobId,
        useCache: true,
        onProgress: async (progress, message, partialResult) => {
          await saveProgress(jobId, progress, message, partialResult);
        }
      }
    );

    // Final save
    const finalResult = buildResult(pipelineResult);
    
    await prisma.ideationJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        message: 'Complete!',
        result: finalResult,
        errors: pipelineResult.errors?.length > 0 ? pipelineResult.errors : null,
        total_cost: pipelineResult.total_cost || 0,
        cost_breakdown: pipelineResult.cost_breakdown || {},
        completed_at: new Date()
      }
    });

    console.log(`[PIPELINE_JOB] Job ${jobId} completed`);
    return pipelineResult;

  } catch (error) {
    console.error(`[PIPELINE_JOB] Job ${jobId} failed:`, error.message);

    await prisma.ideationJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        progress: 0,
        message: error.message,
        errors: [{ error: error.message }],
        completed_at: new Date()
      }
    });

    throw error;
  }
}

/**
 * Save progress and partial results to database
 */
async function saveProgress(jobId, progress, message, partialResult) {
  const prisma = prismaClient;
  if (!prisma) return;

  try {
    const updateData = {
      progress,
      message
    };

    // Save partial result when concept is ready
    if (partialResult?.product_concept || partialResult?.stages?.product_concept) {
      updateData.result = buildResult(partialResult);
    }

    await prisma.ideationJob.update({
      where: { id: jobId },
      data: updateData
    });
  } catch (e) {
    // Don't fail job on progress save error
    console.warn('[PIPELINE_JOB] Progress save failed:', e.message);
  }
}

/**
 * Build result object (compact format + extended data)
 */
function buildResult(pipelineResult) {
  const concept = pipelineResult.product_concept || pipelineResult.stages?.product_concept;
  
  if (!concept) return null;

  // Compact format
  const result = {
    name: concept.name || '',
    tagline: concept.tagline || '',
    description: concept.description || concept.tagline || ''
  };

  // Extended data
  const stages = pipelineResult.stages || {};
  
  if (stages.research_brief) result._research = stages.research_brief;
  if (stages.screen_specs?.screens) result._screens = stages.screen_specs.screens;
  if (stages.mockup_scene) result._mockup = stages.mockup_scene;
  
  // Include showcase image if available
  if (pipelineResult.showcase) {
    result._showcase = pipelineResult.showcase;
  }

  return result;
}

/**
 * Get enhanced job result
 */
export async function getEnhancedJobResult(jobId) {
  const prisma = prismaClient;
  if (!prisma) throw new Error('Database not available');

  const job = await prisma.ideationJob.findUnique({ where: { id: jobId } });
  if (!job) return null;

  const result = job.result || {};

  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    message: job.message,
    
    // Core concept (always available once processing starts)
    concept: {
      name: result.name,
      tagline: result.tagline,
      features: result.features,
      tech_stack: result.tech_stack,
      monetization: result.monetization,
      roadmap: result.roadmap,
      ui_inspiration: result.ui_inspiration
    },
    
    // Extended data (available progressively)
    research: result._research || null,
    screens: result._screens || null,
    image_prompts: result._image_prompts || null,
    images: result._images || null,
    mockup: result._mockup || null,
    
    // Metadata
    cost: job.total_cost,
    errors: job.errors,
    created_at: job.created_at,
    completed_at: job.completed_at
  };
}

export default {
  processIdeationPipelineJob,
  getEnhancedJobResult
};
