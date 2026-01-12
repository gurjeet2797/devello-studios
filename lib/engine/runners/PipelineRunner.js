/**
 * Pipeline Runner v2
 * 
 * Orchestrates the ideation pipeline with progressive results:
 * 1. ProductConcept (FAST) → Return immediately, continue in background
 * 2. ResearchBrief → Enhance concept with research
 * 3. ScreenSpecs → Design 4 screens
 * 4. ImagePrompts → Generate prompts for images
 * 5. MockupScene → Composition spec
 * 
 * Progressive saving: Results saved after each stage
 */

import { runStage, runShowcaseGeneration } from './StageRunner.js';
import { 
  PipelineStage, 
  StageProgress, 
  StageTimeouts,
  DesignSystemDefaults 
} from '../specs/IdeationSchemas.js';

/**
 * Run the complete ideation pipeline with progressive results
 * 
 * @param {Object} input - Pipeline input
 * @param {string} input.idea - The app idea
 * @param {Object} input.context - Optional context
 * @param {Object} options - Pipeline options
 * @returns {Promise<Object>} - Complete pipeline result
 */
export async function runIdeationPipeline(input, options = {}) {
  const {
    requestId = generateRequestId(),
    jobId,
    onProgress = () => {},
    useCache = true
  } = options;

  const pipelineStart = Date.now();
  const results = {
    request_id: requestId,
    created_at: new Date().toISOString(),
    stages: {},
    images: [],
    showcase: null,
    errors: [],
    cost_breakdown: {
      concept: 0,
      research: 0,
      screens: 0,
      image_prompts: 0,
      images: 0,
      mockup: 0,
      showcase: 0
    }
  };

  const stageOptions = { requestId, jobId, useCache };

  try {
    // ========================================
    // PHASE 1: Core Concept (Priority - user sees this first)
    // ========================================
    onProgress(10, 'Crafting something special...', null);
    
    const conceptResult = await runStageWithTimeout(
      PipelineStage.PRODUCT_CONCEPT,
      {
        idea: input.idea,
        context: input.context,
        research_brief: null
      },
      stageOptions,
      StageTimeouts[PipelineStage.PRODUCT_CONCEPT]
    );

    if (conceptResult.error) {
      throw new Error(`Concept generation failed: ${conceptResult.error}`);
    }

    results.stages.product_concept = conceptResult.result;
    results.cost_breakdown.concept = conceptResult.cost || 0;
    
    // IMPORTANT: Emit concept immediately - this is what the user sees first
    onProgress(35, 'The vision is taking shape...', {
      product_concept: results.stages.product_concept,
      _ready: true // Signal that partial result is usable
    });

    // ========================================
    // PHASE 2: Research Enhancement (Background)
    // ========================================
    onProgress(40, 'Connecting the dots...', results);
    
    const researchResult = await runStageWithTimeout(
      PipelineStage.RESEARCH_BRIEF,
      { idea: input.idea, context: input.context },
      stageOptions,
      StageTimeouts[PipelineStage.RESEARCH_BRIEF]
    );

    if (!researchResult.error) {
      results.stages.research_brief = researchResult.result;
      results.cost_breakdown.research = researchResult.cost || 0;
    } else {
      console.warn('[PIPELINE] Research failed, continuing:', researchResult.error);
    }

    onProgress(50, 'Layers coming together...', results);

    // ========================================
    // PHASE 3: Screen Design
    // ========================================
    onProgress(55, 'Sketching the canvas...', results);

    const screenResult = await runStageWithTimeout(
      PipelineStage.SCREEN_SPECS,
      {
        product_concept: results.stages.product_concept,
        design_system: DesignSystemDefaults
      },
      stageOptions,
      StageTimeouts[PipelineStage.SCREEN_SPECS]
    );

    if (!screenResult.error) {
      results.stages.screen_specs = screenResult.result;
      results.cost_breakdown.screens = screenResult.cost || 0;
    } else {
      console.warn('[PIPELINE] Screen specs failed:', screenResult.error);
    }

    onProgress(65, 'The blueprint emerges...', results);

    // ========================================
    // PHASE 4: Mockup Scene (Skip individual images, go straight to showcase)
    // ========================================
    if (results.stages.screen_specs?.screens) {
      onProgress(75, 'Weaving the final threads...', results);

      const mockupResult = await runStageWithTimeout(
        PipelineStage.MOCKUP_SCENE,
        {
          screens: results.stages.screen_specs.screens,
          product_concept: results.stages.product_concept,
          research_brief: results.stages.research_brief
        },
        stageOptions,
        StageTimeouts[PipelineStage.MOCKUP_SCENE]
      );

      if (!mockupResult.error) {
        results.stages.mockup_scene = mockupResult.result;
        results.cost_breakdown.mockup = mockupResult.cost || 0;
        
        // Generate showcase image from mockup scene spec
        onProgress(85, 'Almost there...', results);
        
        try {
          const showcaseResult = await runShowcaseGeneration(mockupResult.result, { jobId });
          
          if (showcaseResult.success) {
            results.showcase = showcaseResult;
            results.cost_breakdown.showcase = 0; // Cost tracked in image generation
            console.log(`[PIPELINE] Showcase generated successfully`);
          } else {
            console.warn(`[PIPELINE] Showcase generation failed: ${showcaseResult.error}`);
            results.showcase = showcaseResult;
          }
        } catch (e) {
          console.warn('[PIPELINE] Showcase generation error:', e.message);
          results.showcase = { success: false, error: e.message };
        }
      }
    }

    // ========================================
    // COMPLETE
    // ========================================
    const totalCost = Object.values(results.cost_breakdown).reduce((a, b) => a + b, 0);
    const executionTime = Date.now() - pipelineStart;

    const finalResult = {
      ...results,
      status: 'completed',
      total_cost: totalCost,
      execution_time_ms: executionTime
    };

    onProgress(100, 'It\'s ready...', finalResult);
    console.log(`[PIPELINE] Complete in ${executionTime}ms, cost: $${totalCost.toFixed(6)}`);

    return finalResult;

  } catch (error) {
    console.error('[PIPELINE] Error:', error.message);
    
    return {
      ...results,
      status: 'failed',
      error: error.message,
      total_cost: Object.values(results.cost_breakdown).reduce((a, b) => a + b, 0),
      execution_time_ms: Date.now() - pipelineStart
    };
  }
}

/**
 * Run stage with timeout
 */
async function runStageWithTimeout(stage, input, options, timeoutSec) {
  const timeoutMs = timeoutSec * 1000;
  
  return Promise.race([
    runStage(stage, input, options),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${stage} timed out`)), timeoutMs)
    )
  ]).catch(error => ({
    result: null,
    error: error.message
  }));
}

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Extract partial result for early display
 */
export function extractPartialResult(pipelineResult) {
  return {
    request_id: pipelineResult.request_id,
    status: pipelineResult.status || 'processing',
    product_concept: pipelineResult.stages?.product_concept || null,
    research_brief: pipelineResult.stages?.research_brief || null,
    screens: pipelineResult.stages?.screen_specs?.screens || null,
    images: pipelineResult.images?.filter(i => i.success) || [],
    mockup_scene: pipelineResult.stages?.mockup_scene || null
  };
}

export default {
  runIdeationPipeline,
  extractPartialResult
};
