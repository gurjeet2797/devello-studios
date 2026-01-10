import aiService from '../../../lib/aiService.js';
import { withMiddleware } from '../../../lib/middleware.js';
import { createLogger } from '../../../lib/logger.js';

const logger = createLogger('upscale-api');

const handler = async (req, res) => {
  const timer = logger.startTimer('upscale-prediction');
  
  try {
    const { image, scale = 2, preserveAspectRatio, preserveOrientation, originalDimensions } = req.body;
    
    console.log('Upscale request:', {
      image, 
      scale, 
      preserveAspectRatio, 
      preserveOrientation,
      originalDimensions,
      body: req.body 
    });
    
    if (!image) {
      return res.status(400).json({ error: "No input image provided" });
    }

    logger.info('Creating upscale prediction', { scale, preserveAspectRatio });

    // Skip URL validation for production URLs
    const isProductionUrl = image.includes('supabase.co') || image.includes('replicate.delivery');
    
    if (isProductionUrl) {
      logger.info('Skipping URL validation for production URL', { image });
    }

    // Pass aspect ratio and orientation preservation parameters to aiService
    const result = await aiService.upscaleImage(image, scale, { preserveAspectRatio, preserveOrientation, originalDimensions });

    timer.end('Upscale prediction completed successfully');
    
    logger.info('Upscale prediction completed', { 
      output: result.output,
      scale
    });

    return res.status(200).json(result);
    
  } catch (error) {
    timer.end('Upscale prediction failed');
    logger.error('Upscale prediction error', { error: error.message });
    
    return res.status(500).json({ 
      error: "Error processing upscale prediction",
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
