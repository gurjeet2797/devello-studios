import aiService, { AI_TOOLS } from '../../../lib/aiService.js';
import { withMiddleware } from '../../../lib/middleware.js';
import { createLogger } from '../../../lib/logger.js';

const logger = createLogger('assisted-edit-api');

const handler = async (req, res) => {
  const timer = logger.startTimer('assisted-edit-prediction');
  
  try {
    const { image, prompt, customPrompt, allHotspots } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No input image provided' });
    }

    if (!prompt && !customPrompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    // Assisted edit includes reference image context in the prompt via aiService
    const finalPrompt = customPrompt || prompt;

    console.log('Assisted edit request:', {
      hasCustomPrompt: !!customPrompt,
      hasPrompt: !!prompt,
      finalPrompt,
      imageUrl: image,
      hotspots: allHotspots || []
    });

    const prediction = await aiService.createGeminiPrediction(AI_TOOLS.ASSISTED_EDIT, {
      image,
      customPrompt: finalPrompt,
      allHotspots
    });

    timer.end('Assisted edit prediction created successfully');

    if (prediction.status === 'succeeded') {
      return res.status(200).json(prediction);
    }
    return res.status(200).json(prediction);
  } catch (error) {
    timer.end('Assisted edit prediction failed');
    logger.error('Assisted edit prediction error', { error: error.message, stack: error.stack });
    return res.status(500).json({ 
      error: 'Error processing assisted edit prediction',
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


