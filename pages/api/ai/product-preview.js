import { GoogleGenAI } from '@google/genai';
import { apiCostTracker } from '../../../lib/apiCostTracker';
import { requireAuth } from '../../../lib/authMiddleware';

// Initialize Gemini lazily to avoid module load errors
let gemini = null;
const getGemini = () => {
  if (!gemini) {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not configured');
    }
    try {
      gemini = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    } catch (initError) {
      console.error('❌ [PRODUCT_PREVIEW] Failed to initialize Gemini:', initError);
      throw new Error(`Failed to initialize Gemini: ${initError.message}`);
    }
  }
  return gemini;
};

async function handler(req, res) {
  // Ensure we always return JSON, even on errors
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validate API key early
    if (!process.env.GOOGLE_API_KEY) {
      console.error('❌ [PRODUCT_PREVIEW] GOOGLE_API_KEY not configured');
      return res.status(500).json({
        error: 'Failed to generate product preview image',
        message: 'API configuration error'
      });
    }
    const { productType, material, dimensions, description } = req.body;
    
    if (!productType || !material || !dimensions) {
      return res.status(400).json({ 
        error: 'productType, material, and dimensions are required fields.' 
      });
    }

    // Compose a detailed prompt for the image generation
    let promptText = `High-quality product photo of a ${material} ${productType}`;
    if (dimensions) {
      promptText += `, dimensions ${dimensions}`;
    }
    // Include additional description if provided (e.g., style or specific features)
    if (description) {
      promptText += `. ${description}. Make sure the generated product matches these specific requirements.`;
    }
    // Add styling guidelines for consistency and branding
    promptText += `. The ${productType.toLowerCase()} is shown on a clean neutral background, well-lit, in full color. `
                + `Professional, realistic render, consistent with a modern product catalog.`;
    // (We avoid explicitly forcing text/logo in prompt, since AI might not render text well)

    const startTime = Date.now();
    // Use the Gemini Nano Banana Pro model for image generation (same as general edit tool)
    let modelName = process.env.GEMINI_PRODUCT_PREVIEW_MODEL || 'gemini-2.5-flash-image';
    
    const geminiInstance = getGemini();
    let response;
    try {
      console.log('🚀 [PRODUCT_PREVIEW] Using model:', modelName);
      console.log('🚀 [PRODUCT_PREVIEW] Prompt length:', promptText.length);
      response = await geminiInstance.models.generateContent({
        model: modelName,
        contents: { 
          parts: [{ text: promptText }] 
        },
      });
      console.log('✅ [PRODUCT_PREVIEW] Response received:', {
        hasResponse: !!response,
        hasResponseResponse: !!response?.response,
        hasCandidates: !!response?.response?.candidates
      });
    } catch (modelError) {
      console.error('❌ [PRODUCT_PREVIEW] Model error:', {
        message: modelError.message,
        stack: modelError.stack,
        name: modelError.name
      });
      // If model fails, try gemini-2.5-flash-image as fallback
      if (modelError.message?.includes('not found') || modelError.message?.includes('404') || modelError.message?.includes('model')) {
        console.log('⚠️ [PRODUCT_PREVIEW] Image generation model failed, trying fallback...');
        try {
          modelName = 'gemini-2.5-flash-image';
          response = await geminiInstance.models.generateContent({
            model: modelName,
            contents: { 
              parts: [{ text: promptText }] 
            },
          });
          console.log(`✅ [PRODUCT_PREVIEW] Using fallback model: ${modelName}`);
        } catch (fallbackError) {
          console.error('❌ [PRODUCT_PREVIEW] Both models failed:', {
            primary: modelError.message,
            fallback: fallbackError.message
          });
          throw new Error(`Gemini model error: ${modelError.message}. Please check that the model name is correct and you have access to image generation models.`);
        }
      } else {
        throw modelError;
      }
    }

    const executionTime = Date.now() - startTime;

    // Handle nested response structure (response.response) or direct response
    const actualResponse = response.response || response;

    // Check for prompt blocking first
    if (actualResponse.promptFeedback?.blockReason) {
      const { blockReason, blockReasonMessage } = actualResponse.promptFeedback;
      const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
      console.error('Product preview generation blocked:', errorMessage);
      return res.status(500).json({
        error: 'Failed to generate product preview image',
        message: errorMessage
      });
    }

    // Parse out the image content from the response (inlineData with base64 image)
    const imagePart = actualResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
    if (!imagePart || !imagePart.inlineData) {
      // If no image was returned, handle as an error
      const finishReason = actualResponse.candidates?.[0]?.finishReason;
      const errorMessage = finishReason 
        ? `Image generation stopped: ${finishReason}` 
        : 'No image generated';
      console.error('Product preview generation error:', errorMessage);
      return res.status(500).json({
        error: 'Failed to generate product preview image',
        message: errorMessage
      });
    }

    // Construct data URL from the returned inline image data
    const { mimeType, data } = imagePart.inlineData;
    const imageDataUrl = `data:${mimeType};base64,${data}`;

    // Track token usage cost (Gemini pricing) for this generation
    const usage = actualResponse.usageMetadata || {};
    const promptTokens = usage.promptTokenCount || 0;
    const outputTokens = usage.candidatesTokenCount || 0;
    const cost = await apiCostTracker.trackGeminiCost(
      promptTokens, 
      outputTokens, 
      modelName,
      { 
        prompt: promptText.substring(0, 100), 
        endpoint: '/api/ai/product-preview', 
        executionTime 
      }
    );

    return res.status(200).json({
      image: imageDataUrl,
      usage: {
        prompt_tokens: promptTokens,
        output_tokens: outputTokens,
        model: modelName
      },
      cost: {
        amount: cost,
        currency: 'USD'
      },
      execution_time: executionTime
    });
  } catch (error) {
    console.error('❌ [PRODUCT_PREVIEW] Product preview generation error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      error: error
    });
    
    // Ensure we return JSON even if something goes wrong
    try {
      return res.status(500).json({
        error: 'Failed to generate product preview image',
        message: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } catch (jsonError) {
      // If even JSON response fails, log and return minimal response
      console.error('❌ [PRODUCT_PREVIEW] Failed to send JSON response:', jsonError);
      res.status(500).end('Internal Server Error');
    }
  }
}

// SECURITY: Require authentication for this expensive endpoint
export default requireAuth(handler);

