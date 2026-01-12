/**
 * Ideation Engine JSON Schemas
 * 
 * Single source of truth for all stage output contracts.
 * Uses Joi for validation (already installed in project).
 */

import Joi from 'joi';

// Common metadata schema included in all outputs
const metadataSchema = {
  schema_version: Joi.string().required(),
  request_id: Joi.string().required(),
  created_at: Joi.string().isoDate().required()
};

/**
 * Stage A: ResearchBrief
 * Market/user research and context analysis
 */
export const ResearchBriefSchema = Joi.object({
  ...metadataSchema,
  summary: Joi.string().min(1).max(1000).required(),
  insights: Joi.array().items(Joi.string()).max(10).required(),
  recommendations: Joi.array().items(Joi.string()).max(10).required(),
  references: Joi.array().items(Joi.string()).default([])
}).unknown(true);

/**
 * Stage B: ProductConcept
 * Elegant concept with two-word name and description
 */
export const ProductConceptSchema = Joi.object({
  name: Joi.string().min(1).max(30).required(), // Two words with space, e.g., "Sky Flow"
  tagline: Joi.string().min(1).max(100).required(),
  description: Joi.string().min(1).max(100).required() // Compact: 1 sentence, 20-40 words (about 100 chars)
}).unknown(true);

/**
 * Stage C: ScreenSpec (single screen)
 */
export const ScreenSpecSchema = Joi.object({
  screen_id: Joi.number().integer().min(1).max(10).required(),
  name: Joi.string().min(1).max(100).required(),
  context: Joi.string().min(1).max(500).required(),
  elements: Joi.array().items(Joi.string()).min(1).max(20).required()
}).unknown(true);

/**
 * Stage C output: ScreenSpecs (array of 4 screens)
 */
export const ScreenSpecsOutputSchema = Joi.object({
  ...metadataSchema,
  screens: Joi.array().items(ScreenSpecSchema).min(1).max(10).required()
}).unknown(true);

/**
 * Stage D: ImagePrompt (single prompt)
 */
export const ImagePromptSchema = Joi.object({
  screen_id: Joi.number().integer().min(1).max(10).required(),
  prompt: Joi.string().min(1).max(2000).required()
}).unknown(true);

/**
 * Stage D output: ImagePrompts (array of 4 prompts)
 */
export const ImagePromptsOutputSchema = Joi.object({
  ...metadataSchema,
  image_prompts: Joi.array().items(ImagePromptSchema).min(1).max(10).required()
}).unknown(true);

/**
 * Stage E: MockupScene - Devello Product Showcase
 */
export const MockupSceneSchema = Joi.object({
  template_name: Joi.string().default('Devello Product Showcase'),
  style: Joi.object({
    theme: Joi.string().default('Minimalist'),
    background_color: Joi.string().default('#F2F2F2'),
    alignment: Joi.string().default('Center'),
    vibe: Joi.string().default('Professional, Clean, Modern')
  }).default({}),
  layout: Joi.object({
    header_section: Joi.object({
      logo_placement: Joi.string().default('Top Left'),
      title_placement: Joi.string().default('Center Middle'),
      subtitle_placement: Joi.string().default('Center Middle, below title')
    }).default({}),
    mockup_section: Joi.object({
      arrangement: Joi.string().default('Horizontal Row'),
      alignment: Joi.string().default('Bottom Aligned'),
      devices_order: Joi.array().items(Joi.string()).default(['Laptop', 'Tablet', 'Smartphone', 'Smartwatch'])
    }).default({})
  }).default({}),
  text_elements: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    text: Joi.string().required(),
    font_family: Joi.string().required(),
    font_weight: Joi.string().required(),
    color: Joi.string().required(),
    size: Joi.string().required(),
    position: Joi.alternatives().try(Joi.string(), Joi.object()).required()
  })).default([]),
  visual_elements: Joi.array().items(Joi.object({
    device: Joi.string().required(),
    screen_content: Joi.string().required(),
    orientation: Joi.string().required(),
    position: Joi.string().optional()
  })).min(4).max(4).required()
}).unknown(true);

/**
 * Design system defaults for consistent UI generation
 */
export const DesignSystemDefaults = {
  color_palette: {
    primary: '#4A90E2',
    secondary: '#50C878',
    accent: '#FF6B6B',
    background: '#FFFFFF',
    surface: '#F5F7FA',
    text_primary: '#1A1A1A',
    text_secondary: '#6B7280'
  },
  typography: {
    font_family: 'Inter, system-ui, sans-serif',
    base_size: '16px',
    heading_scale: 1.25,
    line_height: 1.5
  },
  spacing: {
    base: 8,
    scale: [4, 8, 12, 16, 24, 32, 48, 64]
  },
  component_style: {
    border_radius: '12px',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    style: 'modern_minimal'
  }
};

/**
 * Stage enum for pipeline tracking
 */
export const PipelineStage = {
  RESEARCH_BRIEF: 'ResearchBrief',
  PRODUCT_CONCEPT: 'ProductConcept',
  SCREEN_SPECS: 'ScreenSpecs',
  IMAGE_PROMPTS: 'ImagePrompts',
  IMAGE_RENDERING: 'ImageRendering',
  MOCKUP_SCENE: 'MockupScene'
};

/**
 * Progress percentages for each stage
 */
export const StageProgress = {
  [PipelineStage.RESEARCH_BRIEF]: 15,
  [PipelineStage.PRODUCT_CONCEPT]: 35,
  [PipelineStage.SCREEN_SPECS]: 50,
  [PipelineStage.IMAGE_PROMPTS]: 60,
  [PipelineStage.IMAGE_RENDERING]: 90,
  [PipelineStage.MOCKUP_SCENE]: 100
};

/**
 * Stage timeout configuration (in seconds)
 * Increased for robust quality-first execution
 */
export const StageTimeouts = {
  [PipelineStage.RESEARCH_BRIEF]: 60,
  [PipelineStage.PRODUCT_CONCEPT]: 90,
  [PipelineStage.SCREEN_SPECS]: 60,
  [PipelineStage.IMAGE_PROMPTS]: 45,
  [PipelineStage.IMAGE_RENDERING]: 240, // 4 parallel high-quality images
  [PipelineStage.MOCKUP_SCENE]: 60
};

export default {
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
};
