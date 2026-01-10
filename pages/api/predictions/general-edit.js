import aiService, { AI_TOOLS } from '../../../lib/aiService.js';
import { withMiddleware } from '../../../lib/middleware.js';
import { createLogger } from '../../../lib/logger.js';
import { enhancedPromptGenerator } from '../../../lib/enhancedPromptGenerator.js';

const logger = createLogger('general-edit-api');

const handler = async (req, res) => {
  const timer = logger.startTimer('general-edit-prediction');
  
  // Set a response timeout to prevent hanging requests
  let responseTimeout;
  const setupTimeout = () => {
    responseTimeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.error('Request timeout - no response sent after 90 seconds');
        try {
          res.status(504).json({ 
            error: 'Request timeout',
            message: 'The image processing request took too long to complete'
          });
        } catch (timeoutError) {
          logger.error('Failed to send timeout response', { error: timeoutError.message });
        }
      }
    }, 90000); // 90 second timeout
  };
  
  setupTimeout();
  
  const clearResponseTimeout = () => {
    if (responseTimeout) {
      clearTimeout(responseTimeout);
    }
  };
  
  try {
    const { image, prompt, customPrompt, hotspots, imageContext } = req.body;

    if (!image) {
      clearResponseTimeout();
      return res.status(400).json({ error: "No input image provided" });
    }

    if (!prompt && !customPrompt) {
      clearResponseTimeout();
      return res.status(400).json({ error: "No prompt provided" });
    }

    logger.info('Creating general edit prediction', { 
      hasCustomPrompt: !!customPrompt,
      hasPrompt: !!prompt,
      hotspotCount: hotspots?.length || 0,
      hasImageContext: !!imageContext
    });

    // Phase 3: Enhanced prompt generation with context awareness
    let finalPrompt;
    if (customPrompt) {
      // Use enhanced prompt generator for custom prompts
      finalPrompt = enhancedPromptGenerator.generateEnhancedPrompt(
        hotspots || [], 
        imageContext, 
        customPrompt
      );
    } else if (prompt) {
      // Use enhanced prompt generator for standard prompts
      finalPrompt = enhancedPromptGenerator.generateEnhancedPrompt(
        hotspots || [], 
        imageContext, 
        prompt
      );
    } else {
      // Use enhanced prompt generator with default behavior
      finalPrompt = enhancedPromptGenerator.generateEnhancedPrompt(
        hotspots || [], 
        imageContext
      );
    }

    // Validate hotspots if provided
    if (hotspots && hotspots.length > 0) {
      const validation = enhancedPromptGenerator.validateHotspots(hotspots, imageContext);
      if (!validation.isValid) {
        logger.warn('Hotspot validation failed', { validation });
      }
      if (validation.warnings.length > 0) {
        logger.info('Hotspot validation warnings', { warnings: validation.warnings });
      }
    }

    // Log the final prompt that will be sent to Gemini
    console.log('General edit request:', {
      hasCustomPrompt: !!customPrompt,
      hasPrompt: !!prompt,
      basePrompt: customPrompt ? 'Using custom prompt' : aiService.getPrompt(AI_TOOLS.GENERAL_EDIT, 'default'),
      finalPrompt,
      imageUrl: image
    });

    // Use Gemini for image processing with timeout protection
    let prediction;
    let geminiTimeout;
    try {
      // Set a timeout for the Gemini API call (60 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        geminiTimeout = setTimeout(() => reject(new Error('Gemini API call timed out after 60 seconds')), 60000);
      });

      prediction = await Promise.race([
        aiService.createGeminiPrediction(AI_TOOLS.GENERAL_EDIT, {
          image,
          customPrompt: finalPrompt,
          hotspots: hotspots || []
        }),
        timeoutPromise
      ]);
      
      // Clear the timeout if the promise resolved successfully
      if (geminiTimeout) {
        clearTimeout(geminiTimeout);
      }
    } catch (predictionError) {
      // Clear the timeout on error
      if (geminiTimeout) {
        clearTimeout(geminiTimeout);
      }
      logger.error('Gemini prediction failed in handler', {
        error: predictionError.message,
        stack: predictionError.stack
      });
      throw predictionError; // Re-throw to be caught by outer catch block
    }

    // Validate prediction response
    if (!prediction) {
      throw new Error('Gemini prediction returned null or undefined');
    }

    timer.end('General edit prediction created successfully');
    
    logger.info('General edit prediction created', { 
      id: prediction.id,
      status: prediction.status,
      promptLength: finalPrompt.length
    });

    // Clear timeout since we're sending a response
    clearResponseTimeout();
    
    // For Gemini, return the result immediately since it's not async
    // Always return a response, even if status is not 'succeeded'
    if (!res.headersSent) {
      return res.status(200).json(prediction);
    } else {
      logger.warn('Response already sent, cannot send prediction result');
    }
    
  } catch (error) {
    // Clear timeout on error
    clearResponseTimeout();
    timer.end('General edit prediction failed');
    logger.error('General edit prediction error', { 
      error: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    console.error('❌ [GENERAL_EDIT_API] Full error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
      response: error.response?.data || error.response
    });
    
    // Ensure we always send a response
    if (res.headersSent) {
      // If headers were already sent, log the error but don't try to send again
      logger.error('Error occurred but response already sent', { error: error.message });
      return;
    }
    
    // Check if it's an API key issue
    if (error.message.includes('API key') || error.message.includes('GOOGLE_API_KEY')) {
      return res.status(500).json({ 
        error: "Google API key not configured. Please check environment variables.",
        message: error.message 
      });
    }
    
    // Check if it's a model name issue
    if (error.message.includes('404') || error.message.includes('not found') || error.message.includes('model')) {
      return res.status(500).json({ 
        error: "Model not found. Please check the model name.",
        message: error.message 
      });
    }
    
    // Check if it's a timeout
    if (error.message.includes('timed out') || error.message.includes('timeout')) {
      return res.status(504).json({ 
        error: "Request timeout",
        message: "The image processing request took too long to complete. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Generic error response
    return res.status(500).json({ 
      error: "Error processing general edit prediction",
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export default withMiddleware(handler, {
  validation: {
    method: 'POST',
    requireBody: true,
    requiredFields: ['image']
  }
});
