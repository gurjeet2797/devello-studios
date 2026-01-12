/**
 * Ideation Engine v2.0
 * 
 * Multi-stage AI-powered ideation pipeline.
 * 
 * Stages:
 * A. ResearchBrief - Market/user analysis
 * B. ProductConcept - Full product concept
 * C. ScreenSpecs - 4 core screen definitions  
 * D. ImagePrompts - Image generation prompts
 * E. MockupScene - Final composition spec
 * 
 * Features:
 * - JSON-first outputs with schema validation
 * - Staged pipeline with progress tracking
 * - Parallel image generation
 * - Caching and reproducibility
 * - Error recovery and graceful degradation
 */

// Core exports
export { runIdeationPipeline, extractPartialResult } from './runners/PipelineRunner.js';
export { runStage, runShowcaseGeneration } from './runners/StageRunner.js';

// Schemas and validation
export {
  ResearchBriefSchema,
  ProductConceptSchema,
  ScreenSpecSchema,
  ScreenSpecsOutputSchema,
  ImagePromptSchema,
  ImagePromptsOutputSchema,
  MockupSceneSchema,
  DesignSystemDefaults,
  PipelineStage,
  StageProgress,
  StageTimeouts
} from './specs/IdeationSchemas.js';

export {
  validate,
  validateWithRepair,
  parseJsonResponse,
  generateRepairPrompt
} from './validators/SchemaValidator.js';

// Prompt specs
export {
  ResearchPromptSpec,
  ConceptPromptSpec,
  ScreenPromptSpec,
  ImagePromptSpec,
  MockupScenePromptSpec,
  PromptRegistry,
  getPromptSpec
} from './prompts/index.js';

// Cache
export {
  generateCacheKey,
  withCache,
  getStats as getCacheStats,
  clear as clearCache
} from './cache/EngineCache.js';

// Engine version
export const ENGINE_VERSION = '2.0.0';

// Quick access to run full pipeline
export default {
  runIdeationPipeline,
  extractPartialResult,
  runStage,
  runShowcaseGeneration,
  validate,
  validateWithRepair,
  PipelineStage,
  StageProgress,
  ENGINE_VERSION
};
