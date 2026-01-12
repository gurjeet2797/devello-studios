/**
 * Schema Validator
 * 
 * Validates stage outputs against their Joi schemas.
 * Provides detailed error reporting and repair suggestions.
 */

import {
  ResearchBriefSchema,
  ProductConceptSchema,
  ScreenSpecsOutputSchema,
  ImagePromptsOutputSchema,
  MockupSceneSchema,
  PipelineStage
} from '../specs/IdeationSchemas.js';

/**
 * Schema registry - maps stage names to their schemas
 */
const schemaRegistry = {
  [PipelineStage.RESEARCH_BRIEF]: ResearchBriefSchema,
  [PipelineStage.PRODUCT_CONCEPT]: ProductConceptSchema,
  [PipelineStage.SCREEN_SPECS]: ScreenSpecsOutputSchema,
  [PipelineStage.IMAGE_PROMPTS]: ImagePromptsOutputSchema,
  [PipelineStage.MOCKUP_SCENE]: MockupSceneSchema
};

/**
 * Validate data against a stage schema
 * 
 * @param {string} stage - Pipeline stage name
 * @param {Object} data - Data to validate
 * @returns {{ valid: boolean, value: Object, errors: string[] }}
 */
export function validate(stage, data) {
  const schema = schemaRegistry[stage];
  
  if (!schema) {
    return {
      valid: false,
      value: null,
      errors: [`Unknown stage: ${stage}`]
    };
  }

  const { error, value } = schema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => {
      const path = detail.path.join('.');
      return `${path}: ${detail.message}`;
    });

    return {
      valid: false,
      value: null,
      errors
    };
  }

  return {
    valid: true,
    value,
    errors: []
  };
}

/**
 * Validate with auto-repair attempt
 * Tries to fix common issues before validation
 * 
 * @param {string} stage - Pipeline stage name
 * @param {Object} data - Data to validate
 * @param {Object} metadata - Request metadata (request_id, etc.)
 * @returns {{ valid: boolean, value: Object, errors: string[], repaired: boolean }}
 */
export function validateWithRepair(stage, data, metadata = {}) {
  // First try raw validation
  const initialResult = validate(stage, data);
  if (initialResult.valid) {
    return { ...initialResult, repaired: false };
  }

  // Attempt repairs
  const repairedData = attemptRepair(stage, data, metadata);
  const repairedResult = validate(stage, repairedData);

  return {
    ...repairedResult,
    repaired: repairedResult.valid
  };
}

/**
 * Attempt to repair common validation issues
 */
function attemptRepair(stage, data, metadata) {
  const repaired = { ...data };

  // Inject metadata if missing
  if (!repaired.schema_version) {
    repaired.schema_version = '1.0';
  }
  if (!repaired.request_id && metadata.request_id) {
    repaired.request_id = metadata.request_id;
  }
  if (!repaired.created_at) {
    repaired.created_at = new Date().toISOString();
  }

  // Stage-specific repairs
  switch (stage) {
    case PipelineStage.RESEARCH_BRIEF:
      repaired.insights = ensureArrayLength(repaired.insights, 5);
      repaired.recommendations = ensureArrayLength(repaired.recommendations, 5);
      repaired.references = repaired.references || [];
      break;

    case PipelineStage.PRODUCT_CONCEPT:
      repaired.features = ensureArrayLength(repaired.features, 7);
      repaired.roadmap = ensureArrayLength(repaired.roadmap, 6);
      if (repaired.tech_stack?.integrations) {
        repaired.tech_stack.integrations = ensureArrayLength(
          repaired.tech_stack.integrations,
          6
        );
      }
      break;

    case PipelineStage.SCREEN_SPECS:
      if (repaired.screens) {
        repaired.screens = repaired.screens.slice(0, 4);
        // Ensure each screen has required fields
        repaired.screens = repaired.screens.map((screen, idx) => ({
          screen_id: screen.screen_id || idx + 1,
          name: screen.name || `Screen ${idx + 1}`,
          context: screen.context || 'Screen context',
          elements: ensureArrayLength(screen.elements || [], 10)
        }));
      }
      break;

    case PipelineStage.IMAGE_PROMPTS:
      if (repaired.image_prompts) {
        repaired.image_prompts = repaired.image_prompts.slice(0, 4);
        repaired.image_prompts = repaired.image_prompts.map((prompt, idx) => ({
          screen_id: prompt.screen_id || idx + 1,
          prompt: prompt.prompt || `Mobile app screen ${idx + 1}`
        }));
      }
      break;

    case PipelineStage.MOCKUP_SCENE:
      // Ensure slot definitions
      if (repaired.composition_grid?.slot_definitions) {
        const positions = ['far_left', 'middle_left', 'middle_right', 'far_right'];
        repaired.composition_grid.slot_definitions = 
          repaired.composition_grid.slot_definitions.slice(0, 4).map((slot, idx) => ({
            slot_id: slot.slot_id || idx + 1,
            position: slot.position || positions[idx],
            context: slot.context || 'Screen context',
            image_reference_variable: slot.image_reference_variable || `{screen_content_${idx + 1}}`
          }));
        repaired.composition_grid.total_slots = 4;
      }
      break;
  }

  return repaired;
}

/**
 * Helper to ensure array doesn't exceed max length
 */
function ensureArrayLength(arr, maxLength) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, maxLength).filter(item => 
    item && (typeof item === 'string' ? item.trim().length > 0 : true)
  );
}

/**
 * Parse JSON from model response text
 * Handles markdown code blocks and extracts JSON
 * 
 * @param {string} responseText - Raw text from model
 * @returns {{ success: boolean, data: Object | null, error: string | null }}
 */
export function parseJsonResponse(responseText) {
  if (!responseText || typeof responseText !== 'string') {
    return {
      success: false,
      data: null,
      error: 'Empty or invalid response text'
    };
  }

  let jsonStr = responseText.trim();

  // Remove markdown code blocks
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }

  jsonStr = jsonStr.trim();

  try {
    const data = JSON.parse(jsonStr);
    return {
      success: true,
      data,
      error: null
    };
  } catch (parseError) {
    // Try to extract JSON object from text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data,
          error: null
        };
      } catch {
        // Fall through
      }
    }

    return {
      success: false,
      data: null,
      error: `JSON parse error: ${parseError.message}`
    };
  }
}

/**
 * Generate a JSON repair prompt for the model
 * Used when initial output fails validation
 * 
 * @param {string} stage - Pipeline stage
 * @param {string[]} errors - Validation errors
 * @returns {string} - Repair prompt
 */
export function generateRepairPrompt(stage, errors) {
  return `The previous JSON output failed validation with these errors:
${errors.map(e => `- ${e}`).join('\n')}

Please output ONLY valid JSON that fixes all these issues. No explanations, just the corrected JSON.`;
}

export default {
  validate,
  validateWithRepair,
  parseJsonResponse,
  generateRepairPrompt
};
