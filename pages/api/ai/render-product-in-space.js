import { GoogleGenAI } from '@google/genai';
import { apiCostTracker } from '../../../lib/apiCostTracker';

// Configure API body size limit for image uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Allow up to 10MB for image uploads
    },
  },
};

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
      console.error('❌ [RENDER_PRODUCT_IN_SPACE] Failed to initialize Gemini:', initError);
      throw new Error(`Failed to initialize Gemini: ${initError.message}`);
    }
  }
  return gemini;
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.GOOGLE_API_KEY) {
      console.error('❌ [RENDER_PRODUCT_IN_SPACE] GOOGLE_API_KEY not configured');
      return res.status(500).json({
        error: 'Failed to render product in space',
        message: 'API configuration error'
      });
    }

    const { spacePhoto, productImage, productDescription, refinementDescription } = req.body;
    
    if (!spacePhoto || !productImage) {
      return res.status(400).json({ 
        error: 'spacePhoto and productImage are required fields.' 
      });
    }

    const startTime = Date.now();
    const modelName = process.env.GEMINI_PRODUCT_PREVIEW_MODEL || 'gemini-2.5-flash-image';
    
    const geminiInstance = getGemini();
    
    // Convert base64 images to inline data format
    const spacePhotoData = spacePhoto.includes('data:') 
      ? spacePhoto.split(',')[1] 
      : spacePhoto;
    const productImageData = productImage.includes('data:')
      ? productImage.split(',')[1]
      : productImage;

    // Determine MIME types
    const spaceMimeType = spacePhoto.includes('data:image/png') ? 'image/png' : 'image/jpeg';
    const productMimeType = productImage.includes('data:image/png') ? 'image/png' : 'image/jpeg';

    // Build prompt
    let promptText = `Render the product from the product image intelligently into the user's space photo. `;
    promptText += `The product should be seamlessly integrated into the scene, matching lighting, perspective, and scale. `;
    promptText += `IMPORTANT: Preserve the exact aspect ratio and dimensions of the original space photo. The output image must have the same width, height, and aspect ratio as the space photo. `;
    
    if (productDescription) {
      promptText += `Product details: ${productDescription}. `;
    }
    
    if (refinementDescription) {
      promptText += `User requested changes: ${refinementDescription}. Apply these adjustments to the product in the rendered image. `;
    }
    
    promptText += `Make the final image look realistic and professional, as if the product is actually installed in the space. The output image dimensions must match the space photo exactly.`;

    let response;
    try {
      console.log('🚀 [RENDER_PRODUCT_IN_SPACE] Using model:', modelName);
      console.log('🚀 [RENDER_PRODUCT_IN_SPACE] Prompt length:', promptText.length);
      
      response = await geminiInstance.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: spaceMimeType,
                data: spacePhotoData
              }
            },
            {
              inlineData: {
                mimeType: productMimeType,
                data: productImageData
              }
            },
            { text: promptText }
          ]
        },
      });
      
      console.log('✅ [RENDER_PRODUCT_IN_SPACE] Response received');
    } catch (modelError) {
      console.error('❌ [RENDER_PRODUCT_IN_SPACE] Model error:', {
        message: modelError.message,
        stack: modelError.stack
      });
      
      if (modelError.message?.includes('not found') || modelError.message?.includes('404')) {
        console.log('⚠️ [RENDER_PRODUCT_IN_SPACE] Trying fallback model...');
        try {
          const fallbackModel = 'gemini-2.5-flash-image';
          response = await geminiInstance.models.generateContent({
            model: fallbackModel,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: spaceMimeType,
                    data: spacePhotoData
                  }
                },
                {
                  inlineData: {
                    mimeType: productMimeType,
                    data: productImageData
                  }
                },
                { text: promptText }
              ]
            },
          });
          console.log(`✅ [RENDER_PRODUCT_IN_SPACE] Using fallback model: ${fallbackModel}`);
        } catch (fallbackError) {
          console.error('❌ [RENDER_PRODUCT_IN_SPACE] Both models failed:', fallbackError);
          throw new Error(`Gemini model error: ${modelError.message}`);
        }
      } else {
        throw modelError;
      }
    }

    const executionTime = Date.now() - startTime;
    const actualResponse = response.response || response;

    // Check for prompt blocking
    if (actualResponse.promptFeedback?.blockReason) {
      const { blockReason, blockReasonMessage } = actualResponse.promptFeedback;
      const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
      console.error('RENDER_PRODUCT_IN_SPACE generation blocked:', errorMessage);
      return res.status(500).json({
        error: 'Failed to render product in space',
        message: errorMessage
      });
    }

    // Parse out the image content
    const imagePart = actualResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
    if (!imagePart || !imagePart.inlineData) {
      const finishReason = actualResponse.candidates?.[0]?.finishReason;
      const errorMessage = finishReason 
        ? `Image generation stopped: ${finishReason}` 
        : 'No image generated';
      console.error('RENDER_PRODUCT_IN_SPACE generation error:', errorMessage);
      return res.status(500).json({
        error: 'Failed to render product in space',
        message: errorMessage
      });
    }

    // Construct data URL from the returned inline image data
    const { mimeType, data } = imagePart.inlineData;
    const imageDataUrl = `data:${mimeType};base64,${data}`;

    // Track token usage cost
    const usage = actualResponse.usageMetadata || {};
    const promptTokens = usage.promptTokenCount || 0;
    const outputTokens = usage.candidatesTokenCount || 0;
    const cost = await apiCostTracker.trackGeminiCost(
      promptTokens, 
      outputTokens, 
      modelName,
      { 
        prompt: promptText.substring(0, 100), 
        endpoint: '/api/ai/render-product-in-space', 
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
    console.error('❌ [RENDER_PRODUCT_IN_SPACE] Error:', {
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      error: 'Failed to render product in space',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

