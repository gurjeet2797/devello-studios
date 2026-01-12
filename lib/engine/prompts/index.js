/**
 * Prompt Specifications Index
 * Exports all stage prompt specs
 */

export { ResearchPromptSpec } from './ResearchPromptSpec.js';
export { ConceptPromptSpec } from './ConceptPromptSpec.js';
export { ScreenPromptSpec } from './ScreenPromptSpec.js';
export { ImagePromptSpec } from './ImagePromptSpec.js';
export { MockupScenePromptSpec } from './MockupScenePromptSpec.js';

import { ResearchPromptSpec } from './ResearchPromptSpec.js';
import { ConceptPromptSpec } from './ConceptPromptSpec.js';
import { ScreenPromptSpec } from './ScreenPromptSpec.js';
import { ImagePromptSpec } from './ImagePromptSpec.js';
import { MockupScenePromptSpec } from './MockupScenePromptSpec.js';
import { PipelineStage } from '../specs/IdeationSchemas.js';

/**
 * Registry mapping stages to their prompt specs
 */
export const PromptRegistry = {
  [PipelineStage.RESEARCH_BRIEF]: ResearchPromptSpec,
  [PipelineStage.PRODUCT_CONCEPT]: ConceptPromptSpec,
  [PipelineStage.SCREEN_SPECS]: ScreenPromptSpec,
  [PipelineStage.IMAGE_PROMPTS]: ImagePromptSpec,
  [PipelineStage.MOCKUP_SCENE]: MockupScenePromptSpec
};

/**
 * Get prompt spec for a stage
 */
export function getPromptSpec(stage) {
  const spec = PromptRegistry[stage];
  if (!spec) {
    throw new Error(`No prompt spec found for stage: ${stage}`);
  }
  return spec;
}

export default {
  ResearchPromptSpec,
  ConceptPromptSpec,
  ScreenPromptSpec,
  ImagePromptSpec,
  MockupScenePromptSpec,
  PromptRegistry,
  getPromptSpec
};
