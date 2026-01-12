/**
 * Stage Runner
 * 
 * Executes individual pipeline stages with:
 * - Prompt building from specs
 * - Gemini API calls
 * - Response parsing and validation
 * - Retry logic with repair prompts
 */

import { GoogleGenAI } from '@google/genai';
import { getPromptSpec } from '../prompts/index.js';
import { validateWithRepair, parseJsonResponse } from '../validators/SchemaValidator.js';
import { withCache } from '../cache/EngineCache.js';
import { apiCostTracker } from '../../apiCostTracker.js';

// Initialize Gemini client
let gemini = null;
function getGemini() {
  if (!gemini) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY not configured');
    }
    gemini = new GoogleGenAI({ apiKey });
  }
  return gemini;
}

// Default model for text generation stages
const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Run a single pipeline stage
 * 
 * @param {string} stage - Pipeline stage name
 * @param {Object} input - Stage input
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} - Stage result
 */
export async function runStage(stage, input, options = {}) {
  const {
    requestId,
    jobId,
    useCache = true,
    maxRetries = 1,
    model = DEFAULT_MODEL
  } = options;

  console.log(`[STAGE_RUNNER] Starting stage: ${stage}`);
  const startTime = Date.now();

  // Get prompt spec
  const promptSpec = getPromptSpec(stage);
  
  // Build the prompt
  const userPrompt = promptSpec.buildPrompt(input);
  const fullPrompt = `${promptSpec.system}\n\n${userPrompt}`;

  // Cache-aware execution
  const executor = async () => {
    return executeWithRetry(
      stage,
      fullPrompt,
      promptSpec.generationConfig,
      { requestId, jobId, maxRetries, model }
    );
  };

  const result = useCache
    ? await withCache(stage, input, executor, {
        promptVersion: promptSpec.prompt_version,
        skipCache: !useCache
      })
    : await executor();

  const executionTime = Date.now() - startTime;
  console.log(`[STAGE_RUNNER] Stage ${stage} completed in ${executionTime}ms${result.fromCache ? ' (cached)' : ''}`);

  return {
    ...result,
    stage,
    executionTime
  };
}

/**
 * Execute stage with retry logic
 */
async function executeWithRetry(stage, originalPrompt, generationConfig, options) {
  const { requestId, jobId, maxRetries, model } = options;
  let lastError = null;
  let attempts = 0;

  while (attempts <= maxRetries) {
    try {
      const result = await callGemini(originalPrompt, generationConfig, { model, jobId, stage });
      
      // Parse JSON response
      const parsed = parseJsonResponse(result.text);
      if (!parsed.success) {
        console.error(`[STAGE_RUNNER] JSON parse failed for ${stage}:`, parsed.error);
        console.error(`[STAGE_RUNNER] Raw response (first 500 chars):`, result.text?.substring(0, 500));
        throw new Error(`JSON parse failed: ${parsed.error}`);
      }

      // Inject metadata
      const dataWithMetadata = {
        ...parsed.data,
        request_id: requestId || parsed.data.request_id || `auto-${Date.now()}`,
        schema_version: parsed.data.schema_version || '1.0',
        created_at: parsed.data.created_at || new Date().toISOString()
      };

      // Validate with repair (lenient mode)
      const validation = validateWithRepair(stage, dataWithMetadata, { request_id: requestId });
      
      if (!validation.valid) {
        console.warn(`[STAGE_RUNNER] Validation warnings for ${stage}:`, validation.errors.slice(0, 3));
        
        // For critical stages, retry once. For others, accept partial result.
        if (stage === 'ProductConcept' && attempts < maxRetries) {
          console.log(`[STAGE_RUNNER] Retrying ${stage} (attempt ${attempts + 1})`);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // Accept the data even with validation issues (graceful degradation)
        console.warn(`[STAGE_RUNNER] Accepting partial result for ${stage} despite validation issues`);
        return {
          result: dataWithMetadata,
          model: result.model,
          cost: result.cost,
          attempts: attempts + 1,
          repaired: false,
          validationWarnings: validation.errors
        };
      }

      return {
        result: validation.value,
        model: result.model,
        cost: result.cost,
        attempts: attempts + 1,
        repaired: validation.repaired
      };

    } catch (error) {
      lastError = error;
      attempts++;
      
      if (attempts <= maxRetries) {
        console.log(`[STAGE_RUNNER] Attempt ${attempts} failed: ${error.message}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  console.error(`[STAGE_RUNNER] Stage ${stage} failed after ${maxRetries + 1} attempts: ${lastError?.message}`);
  return {
    result: null,
    error: lastError?.message || 'Unknown error',
    attempts: maxRetries + 1
  };
}

/**
 * Call Gemini API
 */
async function callGemini(prompt, generationConfig, options) {
  const { model, jobId, stage } = options;
  const client = getGemini();

  const response = await client.models.generateContent({
    model,
    contents: {
      parts: [{ text: prompt }]
    },
    generationConfig
  });

  // Extract response text
  let responseText = '';
  if (response.response?.candidates?.[0]?.content?.parts) {
    responseText = response.response.candidates[0].content.parts
      .map(part => part.text)
      .join('');
  } else if (response.text) {
    responseText = response.text;
  }

  // Track cost
  let cost = 0;
  if (response.response?.usageMetadata) {
    const { promptTokenCount, candidatesTokenCount } = response.response.usageMetadata;
    if (promptTokenCount && candidatesTokenCount) {
      cost = await apiCostTracker.trackGeminiCost(
        promptTokenCount,
        candidatesTokenCount,
        model,
        {
          endpoint: `/api/studios/ideation/${stage}`,
          jobId,
          stage
        }
      );
    }
  }

  return {
    text: responseText,
    model,
    cost
  };
}

/**
 * Generate showcase mockup image from MockupScene spec
 * 
 * @param {Object} mockupScene - MockupScene JSON spec
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} - Generated image result
 */
export async function runShowcaseGeneration(mockupScene, options = {}) {
  const { jobId } = options;
  
  console.log(`[STAGE_RUNNER] Generating showcase mockup`);
  const startTime = Date.now();

  const IMAGE_MODEL = process.env.GEMINI_IDEATION_IMAGE_MODEL || 'gemini-2.5-flash-image';

  try {
    const client = getGemini();
    
    // Build detailed prompt from mockup scene spec
    const { style, layout, text_elements, visual_elements } = mockupScene;
    
    const prompt = `Create a professional product showcase mockup image:

STYLE:
- Theme: ${style.theme}
- Background: ${style.background_color}
- Vibe: ${style.vibe}

LAYOUT:
- Header: ${text_elements.map(t => `${t.text} (${t.size})`).join(', ')}
- Devices: ${visual_elements.map(v => `${v.device} showing "${v.screen_content}"`).join(' | ')}

VISUAL REQUIREMENTS:
- Professional product photography style
- Clean minimalist design
- Devices arranged horizontally: ${layout.mockup_section.devices_order.join(', ')}
- Each device screen shows the described content
- Soft lighting, subtle shadows
- Premium presentation quality
- 16:9 aspect ratio, high resolution

Generate a photorealistic product showcase mockup with all devices visible and screens showing the described content.`;

    console.log(`[STAGE_RUNNER] Using image model: ${IMAGE_MODEL}`);
    console.log(`[STAGE_RUNNER] Showcase generation prompt:`);
    console.log(`[STAGE_RUNNER] "${prompt.substring(0, 300)}..."`);
    
    const response = await client.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
    });

    const candidates = response.candidates;
    
    console.log(`[STAGE_RUNNER] Response received:`, {
      hasCandidates: !!candidates,
      candidatesLength: candidates?.length,
      finishReason: candidates?.[0]?.finishReason
    });

    if (response.promptFeedback?.blockReason) {
      const { blockReason, blockReasonMessage } = response.promptFeedback;
      console.error(`[STAGE_RUNNER] Showcase blocked: ${blockReason} - ${blockReasonMessage}`);
      return {
        success: false,
        error: `Content blocked: ${blockReason}`,
        executionTime: Date.now() - startTime
      };
    }

    // Find image in response
    const parts = candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        const { mimeType, data } = part.inlineData;
        const imageDataUrl = `data:${mimeType};base64,${data}`;
        
        const executionTime = Date.now() - startTime;
        console.log(`[STAGE_RUNNER] ✓ Showcase generated in ${executionTime}ms`);

        return {
          image_url: imageDataUrl,
          success: true,
          model: IMAGE_MODEL,
          executionTime
        };
      }
    }

    const finishReason = candidates?.[0]?.finishReason;
    const errorMsg = finishReason && finishReason !== 'STOP'
      ? `Generation stopped: ${finishReason}` 
      : 'No image in response';
    
    console.warn(`[STAGE_RUNNER] No image for showcase: ${errorMsg}`);
    
    return {
      success: false,
      error: errorMsg,
      executionTime: Date.now() - startTime
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[STAGE_RUNNER] Showcase generation failed after ${executionTime}ms:`, error.message);
    
    return {
      success: false,
      error: error.message,
      executionTime
    };
  }
}

export default {
  runStage,
  runShowcaseGeneration
};
