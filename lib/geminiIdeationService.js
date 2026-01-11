/**
 * Gemini Ideation Service
 * 
 * Orchestrates AI-powered product ideation using Google Gemini 2.5
 * to transform simple app ideas into complete product concepts.
 */

import { GoogleGenAI } from '@google/genai';
import { apiCostTracker } from './apiCostTracker';
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  selectModel,
  parseResponse
} from './prompts/ideationPrompt';

// Initialize Gemini client
const gemini = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

/**
 * Generate product concept using Gemini AI
 * 
 * @param {Object} options
 * @param {string} options.prompt - User's app idea
 * @param {Object} options.context - Optional context (platform, industry, tone, targetAudience)
 * @param {string} options.jobId - Job ID for cost tracking
 * @returns {Promise<Object>} Generated concept
 */
export async function generateConcept({
  prompt,
  context = {},
  jobId
}) {
  console.log('[GEMINI_IDEATION] Starting concept generation...');
  
  // Build the user prompt
  const userPrompt = buildUserPrompt(prompt, context);
  const contentLength = userPrompt.length;
  const model = selectModel(contentLength);
  
  console.log(`[GEMINI_IDEATION] Using model: ${model}, content length: ${contentLength}`);
  
  const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;
  
  try {
    const startTime = Date.now();
    
    const response = await gemini.models.generateContent({
      model,
      contents: {
        parts: [{ text: fullPrompt }]
      },
      generationConfig: {
        temperature: 0.7, // Balanced creativity and consistency
        maxOutputTokens: 2000, // Sufficient for concept generation
        topP: 0.9,
        topK: 40
      }
    });
    
    const executionTime = Date.now() - startTime;
    
    // Extract response text
    let responseText = '';
    if (response.response?.candidates?.[0]?.content?.parts) {
      responseText = response.response.candidates[0].content.parts
        .map(part => part.text)
        .join('');
    } else if (response.text) {
      responseText = response.text;
    }
    
    console.log(`[GEMINI_IDEATION] Response received in ${executionTime}ms`);
    
    // Track cost and get the cost value
    let geminiCost = 0;
    if (response.response?.usageMetadata) {
      const { promptTokenCount, candidatesTokenCount } = response.response.usageMetadata;
      if (promptTokenCount && candidatesTokenCount) {
        geminiCost = await apiCostTracker.trackGeminiCost(
          promptTokenCount,
          candidatesTokenCount,
          model,
          {
            endpoint: '/api/studios/ideation',
            jobId,
            executionTime
          }
        );
        console.log(`[GEMINI_IDEATION] Tokens: ${promptTokenCount} in, ${candidatesTokenCount} out, Cost: $${geminiCost.toFixed(6)}`);
      }
    }
    
    // Parse the response
    const result = parseResponse(responseText);
    
    console.log(`[GEMINI_IDEATION] Concept generated: ${result.name || 'Unnamed'}`);
    
    return {
      result,
      model,
      executionTime,
      cost: geminiCost
    };
    
  } catch (error) {
    console.error('[GEMINI_IDEATION] Error:', error.message);
    
    return {
      result: {
        name: '',
        tagline: '',
        features: [],
        tech_stack: {
          frontend: '',
          backend: '',
          database: '',
          integrations: []
        },
        monetization: '',
        roadmap: [],
        ui_inspiration: ''
      },
      errors: [error.message],
      model: 'gemini-2.5-flash',
      executionTime: 0,
      cost: 0
    };
  }
}

export default {
  generateConcept
};
