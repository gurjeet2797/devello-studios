import aiService from '../../../lib/aiService.js';
import { createLogger } from '../../../lib/logger.js';

const logger = createLogger('prediction-status');

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  const timer = logger.startTimer('get-prediction');
  
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      logger.warn('No prediction ID provided');
      return new Response(JSON.stringify({ error: "No prediction ID provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    logger.info('Fetching prediction status', { id });



    const prediction = await aiService.getPrediction(id);
    
    timer.end('Prediction status retrieved successfully');
    
    logger.info('Prediction status retrieved', { 
      id, 
      status: prediction.status 
    });

    return new Response(JSON.stringify(prediction), {
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    timer.end('Failed to get prediction status');
    logger.error("Error fetching prediction", { error: error.message });
    
    return new Response(JSON.stringify({ 
      error: "Error fetching prediction",
      message: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
