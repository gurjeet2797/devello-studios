import aiService, { AI_TOOLS } from '../../../lib/aiService.js';
import { withMiddleware } from '../../../lib/middleware.js';
import { createLogger } from '../../../lib/logger.js';

const logger = createLogger('relight-api');

const handler = async (req, res) => {
  const timer = logger.startTimer('relight-prediction');
  
  try {
    const { image, prompt, lightingType } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No input image provided" });
    }

    logger.info('Creating relight prediction', { 
      lightingType,
      hasCustomPrompt: !!prompt
    });



    let finalPrompt;
    if (prompt) {
      finalPrompt = prompt;
    } else if (lightingType) {
      // Use specific lighting type
      finalPrompt = aiService.getPrompt(AI_TOOLS.LIGHTING, lightingType);
    } else {
      // Use default Dramatic Daylight
      finalPrompt = aiService.getPrompt(AI_TOOLS.LIGHTING, 'Dramatic Daylight');
    }

    const prediction = await aiService.createPrediction(AI_TOOLS.LIGHTING, {
      image,
      customPrompt: finalPrompt
    });

    // Check if prediction has error status
    if (prediction.status === 'Error' || prediction.status === 'error' || prediction.status === 'failed') {
      timer.end('Relight prediction failed');
      logger.error('Relight prediction failed', { 
        id: prediction.id,
        status: prediction.status,
        error: prediction.error || prediction.details
      });
      
      return res.status(500).json({
        error: "Image processing failed",
        message: prediction.error || prediction.details || "The image could not be processed. Please try again.",
        status: prediction.status,
        id: prediction.id
      });
    }

    timer.end('Relight prediction created successfully');
    
    logger.info('Relight prediction created', { 
      id: prediction.id,
      status: prediction.status,
      lightingType
    });

    return res.status(200).json(prediction);
    
  } catch (error) {
    timer.end('Relight prediction failed');
    logger.error('Relight prediction error', { error: error.message });
    
    return res.status(500).json({ 
      error: "Error processing relight prediction",
      message: error.message 
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
