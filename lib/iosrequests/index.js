import aiService, { AI_TOOLS } from '../aiService.js';
import { enhancedPromptGenerator } from '../enhancedPromptGenerator.js';
import { storeExternalImageToSupabase } from '../images/ingest.js';

const ALLOWED_LIGHTING_STYLES = [
  'Dramatic Daylight',
  'Midday Bright',
  'Cozy Evening'
];

const MAX_PROMPT_LENGTH = 400;

const createValidationError = (message) => {
  const error = new Error(message);
  error.status = 400;
  error.code = 'INVALID_REQUEST';
  return error;
};

const createProcessingError = (message, status = 500, code = 'PROCESSING_ERROR') => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

const assertNonEmptyString = (value, fieldName) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw createValidationError(`${fieldName} is required`);
  }
};

const assertImageInput = (inputImage) => {
  if (!inputImage || typeof inputImage !== 'object') {
    throw createValidationError('inputImage is required');
  }

  if (typeof inputImage.imageUrl !== 'string' || inputImage.imageUrl.trim().length === 0) {
    throw createValidationError('image_url is required');
  }
};

const assertHotspot = (hotspot) => {
  if (!hotspot || typeof hotspot !== 'object') {
    throw createValidationError('hotspot is required');
  }

  const { x, y } = hotspot;
  const isValidNumber = (value) => Number.isFinite(value);

  if (!isValidNumber(x) || !isValidNumber(y)) {
    throw createValidationError('hotspot must include numeric x and y');
  }

  if (x < 0 || x > 1 || y < 0 || y > 1) {
    throw createValidationError('hotspot coordinates must be normalized between 0 and 1');
  }
};

const extractOutputUrl = (prediction) => {
  const output = prediction?.output;
  if (Array.isArray(output)) {
    return output[0] || null;
  }
  if (typeof output === 'string') {
    return output;
  }
  return null;
};

const waitForPrediction = async (predictionId, { timeoutMs = 60000, intervalMs = 2000 } = {}) => {
  const startTime = Date.now();
  let prediction = await aiService.getPrediction(predictionId);

  while (['starting', 'processing'].includes(prediction.status)) {
    if (Date.now() - startTime > timeoutMs) {
      throw createProcessingError('Image processing timed out', 504, 'PROCESSING_TIMEOUT');
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    prediction = await aiService.getPrediction(predictionId);
  }

  if (['failed', 'error', 'canceled'].includes(prediction.status)) {
    throw createProcessingError('Image processing failed', 500, 'PROCESSING_FAILED');
  }

  return prediction;
};

export const runLightingIOS = async ({ userId, inputImage, style }) => {
  assertNonEmptyString(userId, 'userId');
  assertImageInput(inputImage);
  assertNonEmptyString(style, 'style');

  if (!ALLOWED_LIGHTING_STYLES.includes(style)) {
    throw createValidationError('style is not supported');
  }

  const prediction = await aiService.createPrediction(AI_TOOLS.LIGHTING, {
    image: inputImage.imageUrl,
    prompt: style
  });
  try {
    const finalPrediction = prediction.status === 'succeeded'
      ? prediction
      : await waitForPrediction(prediction.id);

    const outputUrl = extractOutputUrl(finalPrediction);
    if (!outputUrl) {
      throw createProcessingError('Image processing did not return an output URL');
    }

    const storedOutput = await storeExternalImageToSupabase({ imageUrl: outputUrl });

    return {
      ok: true,
      output_url: storedOutput.outputUrl,
      input_url: inputImage.imageUrl,
      request_id: finalPrediction.id,
      model: 'black-forest-labs/flux-kontext-max'
    };
  } catch (error) {
    if (error.code === 'PROCESSING_TIMEOUT') {
      return {
        ok: true,
        status: 'processing',
        job_id: prediction.id,
        request_id: prediction.id
      };
    }
    throw error;
  }
};

export const runSingleEditIOS = async ({ userId, inputImage, hotspot, prompt }) => {
  assertNonEmptyString(userId, 'userId');
  assertImageInput(inputImage);
  assertHotspot(hotspot);
  assertNonEmptyString(prompt, 'prompt');

  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw createValidationError(`prompt exceeds ${MAX_PROMPT_LENGTH} characters`);
  }

  const hotspotPercent = {
    x: Number((hotspot.x * 100).toFixed(2)),
    y: Number((hotspot.y * 100).toFixed(2)),
    prompt
  };

  const finalPrompt = enhancedPromptGenerator.generateEnhancedPrompt([hotspotPercent], null, prompt);

  const prediction = await aiService.createPrediction(AI_TOOLS.GENERAL_EDIT, {
    image: inputImage.imageUrl,
    customPrompt: finalPrompt
  });
  try {
    const finalPrediction = prediction.status === 'succeeded'
      ? prediction
      : await waitForPrediction(prediction.id);

    const outputUrl = extractOutputUrl(finalPrediction);
    if (!outputUrl) {
      throw createProcessingError('Image processing did not return an output URL');
    }

    const storedOutput = await storeExternalImageToSupabase({ imageUrl: outputUrl });

    return {
      ok: true,
      output_url: storedOutput.outputUrl,
      input_url: inputImage.imageUrl,
      request_id: finalPrediction.id,
      model: 'black-forest-labs/flux-kontext-max'
    };
  } catch (error) {
    if (error.code === 'PROCESSING_TIMEOUT') {
      return {
        ok: true,
        status: 'processing',
        job_id: prediction.id,
        request_id: prediction.id
      };
    }
    throw error;
  }
};
