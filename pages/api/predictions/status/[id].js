import aiService from '../../../../lib/aiService.js';
import { createLogger } from '../../../../lib/logger.js';

const logger = createLogger('prediction-status');

export default async function handler(req, res) {
  const timer = logger.startTimer('get-prediction-status');
  
  try {
    const { id } = req.query;

    if (!id || id === 'status') {
      logger.warn('No prediction ID provided');
      return res.status(400).json({ error: "No prediction ID provided" });
    }

    logger.info('Fetching prediction status', { id });

    // Get prediction status from AI service
    const prediction = await aiService.getPrediction(id);
    
    timer.end('Prediction status retrieved successfully');
    
    logger.info('Prediction status retrieved', { 
      id, 
      status: prediction.status 
    });

    return res.status(200).json(prediction);
    
  } catch (error) {
    timer.end('Failed to get prediction status');
    logger.error("Error fetching prediction", { error: error.message });
    
    return res.status(500).json({ 
      error: "Error fetching prediction",
      message: error.message 
    });
  }
}
