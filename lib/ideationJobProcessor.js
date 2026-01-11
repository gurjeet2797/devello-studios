/**
 * Ideation Job Processor
 * 
 * Processes ideation jobs asynchronously:
 * 1. Calls Gemini AI to generate concept
 * 2. Saves result to database
 * 3. Updates job status
 */

import prismaClient from './prisma';
import { generateConcept } from './geminiIdeationService';

/**
 * Update job progress in the database
 */
async function updateJobProgress(jobId, progress, message, extraData = {}) {
  const prisma = prismaClient;
  if (!prisma) return;
  
  try {
    await prisma.ideationJob.update({
      where: { id: jobId },
      data: {
        progress,
        message,
        ...extraData
      }
    });
  } catch (error) {
    console.error('[IDEATION_JOB_PROCESSOR] Failed to update progress:', error.message);
  }
}

/**
 * Main job processing function
 */
export async function processIdeationJob(jobId) {
  const prisma = prismaClient;
  if (!prisma) {
    throw new Error('Database not available');
  }
  
  console.log(`[IDEATION_JOB_PROCESSOR] Starting job ${jobId}`);
  
  // Fetch job
  const job = await prisma.ideationJob.findUnique({
    where: { id: jobId }
  });
  
  if (!job) {
    throw new Error('Job not found');
  }
  
  if (job.status !== 'queued') {
    console.log(`[IDEATION_JOB_PROCESSOR] Job ${jobId} is not queued (status: ${job.status})`);
    return;
  }
  
  // Mark as processing
  await updateJobProgress(jobId, 10, 'Starting concept generation...', {
    status: 'processing',
    started_at: new Date()
  });
  
  const errors = [];
  let result = null;
  let costBreakdown = {
    gemini: 0
  };
  
  try {
    // Update progress
    await updateJobProgress(jobId, 30, 'Generating concept with AI...');
    
    // Generate concept using Gemini
    const conceptResult = await generateConcept({
      prompt: job.prompt,
      context: job.context || {},
      jobId
    });
    
    if (conceptResult.errors && conceptResult.errors.length > 0) {
      errors.push(...conceptResult.errors);
    }
    
    if (conceptResult.result) {
      result = conceptResult.result;
      costBreakdown.gemini = conceptResult.cost || 0;
    } else {
      throw new Error('Failed to generate concept');
    }
    
    // Update progress
    await updateJobProgress(jobId, 90, 'Finalizing concept...');
    
    // Calculate total cost
    const totalCost = costBreakdown.gemini;
    
    // Save result
    await prisma.ideationJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        message: 'Concept generated successfully',
        result: result,
        errors: errors.length > 0 ? errors : null,
        total_cost: totalCost,
        cost_breakdown: costBreakdown,
        completed_at: new Date()
      }
    });
    
    console.log(`[IDEATION_JOB_PROCESSOR] Job ${jobId} completed successfully`);
    
  } catch (error) {
    console.error(`[IDEATION_JOB_PROCESSOR] Job ${jobId} failed:`, error.message);
    
    errors.push(error.message);
    
    // Update job with error
    await prisma.ideationJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        progress: 0,
        message: `Error: ${error.message}`,
        errors: errors,
        completed_at: new Date()
      }
    });
    
    throw error;
  }
}

/**
 * Process next queued job (for batch processing)
 */
export async function processQueuedIdeationJobs() {
  const prisma = prismaClient;
  if (!prisma) {
    throw new Error('Database not available');
  }
  
  // Find next queued job
  const job = await prisma.ideationJob.findFirst({
    where: {
      status: 'queued'
    },
    orderBy: {
      created_at: 'asc'
    }
  });
  
  if (!job) {
    return {
      processed: false,
      message: 'No queued jobs found'
    };
  }
  
  try {
    await processIdeationJob(job.id);
    return {
      processed: true,
      jobId: job.id,
      message: 'Job processed successfully'
    };
  } catch (error) {
    return {
      processed: false,
      jobId: job.id,
      error: error.message
    };
  }
}

export default {
  processIdeationJob,
  processQueuedIdeationJobs
};
