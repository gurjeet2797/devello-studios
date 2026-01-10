import Replicate from 'replicate';
import { apiCostTracker } from '../../../lib/apiCostTracker';
import { requireAuth } from '../../../lib/authMiddleware';
import config from '../../../lib/config';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// SECURITY: Whitelist of allowed model IDs to prevent abuse
const ALLOWED_MODELS = [
  config.replicate.models.flux, // 'black-forest-labs/flux-kontext-max'
  config.replicate.models.upscale, // 'recraft-ai/recraft-crisp-upscale:...'
  // Add other allowed models here as needed
];

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, input } = req.body;
    
    if (!model || !input) {
      return res.status(400).json({ error: 'Model and input are required' });
    }

    // SECURITY: Validate model ID against whitelist
    if (!ALLOWED_MODELS.includes(model)) {
      return res.status(400).json({ 
        error: 'Model not allowed',
        message: `The model "${model}" is not permitted. Only whitelisted models can be used.`
      });
    }

    const startTime = Date.now();
    
    // Start the prediction
    const prediction = await replicate.predictions.create({
      model,
      input
    });

    // Wait for completion
    let result = await replicate.wait(prediction);
    const executionTime = Date.now() - startTime;
    
    // Calculate duration in seconds
    const duration = result.metrics?.predict_time || (executionTime / 1000);
    
    // Track the cost in real-time
    const cost = await apiCostTracker.trackReplicateCost(
      prediction.id,
      model,
      duration,
      result.status,
      {
        input: JSON.stringify(input).substring(0, 100), // First 100 chars for context
        executionTime,
        endpoint: '/api/replicate/with-tracking'
      }
    );

    res.status(200).json({
      id: prediction.id,
      status: result.status,
      output: result.output,
      metrics: result.metrics,
      cost: {
        amount: cost,
        currency: 'USD'
      },
      execution_time: executionTime,
      duration: duration
    });

  } catch (error) {
    console.error('Replicate API error:', error);
    res.status(500).json({ 
      error: 'Failed to run prediction',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// SECURITY: Require authentication for this expensive endpoint
export default requireAuth(handler);
