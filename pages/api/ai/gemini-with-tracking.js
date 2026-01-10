import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiCostTracker } from '../../../lib/apiCostTracker';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model = 'gemini-pro' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const startTime = Date.now();
    const genModel = genAI.getGenerativeModel({ model });
    
    const result = await genModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const executionTime = Date.now() - startTime;
    
    // Extract token usage from the response
    const usage = response.usageMetadata || {};
    const inputTokens = usage.promptTokenCount || 0;
    const outputTokens = usage.candidatesTokenCount || 0;
    
    // Track the cost in real-time
    const cost = await apiCostTracker.trackGeminiCost(
      inputTokens,
      outputTokens,
      model,
      {
        prompt: prompt.substring(0, 100), // First 100 chars for context
        executionTime,
        endpoint: '/api/ai/gemini-with-tracking'
      }
    );

    res.status(200).json({
      text,
      usage: {
        prompt_tokens: inputTokens,
        completion_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
        model
      },
      cost: {
        amount: cost,
        currency: 'USD'
      },
      execution_time: executionTime
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ 
      error: 'Failed to generate content',
      details: error.message 
    });
  }
}
