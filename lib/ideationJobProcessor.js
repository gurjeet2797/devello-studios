/**
 * Ideation Job Processor
 * 
 * Entry point for processing ideation jobs.
 * Delegates to the v2 pipeline engine.
 */

import prismaClient from './prisma';
import { processIdeationPipelineJob, getEnhancedJobResult } from './engine/jobs/IdeationPipelineJob.js';

/**
 * Process a single ideation job
 */
export async function processIdeationJob(jobId) {
  return processIdeationPipelineJob(jobId);
}

/**
 * Get enhanced result with all stages
 */
export { getEnhancedJobResult };

/**
 * Process next queued job (batch processing)
 */
export async function processQueuedIdeationJobs() {
  const prisma = prismaClient;
  if (!prisma) throw new Error('Database not available');
  
  const job = await prisma.ideationJob.findFirst({
    where: { status: 'queued' },
    orderBy: { created_at: 'asc' }
  });
  
  if (!job) {
    return { processed: false, message: 'No queued jobs' };
  }
  
  try {
    await processIdeationPipelineJob(job.id);
    return { processed: true, jobId: job.id };
  } catch (error) {
    return { processed: false, jobId: job.id, error: error.message };
  }
}

export default {
  processIdeationJob,
  processQueuedIdeationJobs,
  getEnhancedJobResult
};
