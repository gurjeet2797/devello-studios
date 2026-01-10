/**
 * Gemini Research Service
 * 
 * Orchestrates AI-powered product extraction using Google Gemini 2.5
 * with Google Search grounding for enhanced accuracy.
 */

import { GoogleGenAI } from '@google/genai';
import { apiCostTracker } from './apiCostTracker';
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  selectModel,
  parseResponse
} from './prompts/productResearchPrompt';

// Initialize Gemini client
const gemini = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

/**
 * Extract products using Gemini AI
 * 
 * @param {Object} options
 * @param {string} options.instructions - User instructions for extraction
 * @param {Object} options.pdfData - Parsed PDF data from pdfService
 * @param {Object|Object[]} options.urlData - Scraped URL data from webScraperService
 * @param {string} options.category - Optional category filter
 * @param {boolean} options.generateSEO - Generate SEO descriptions
 * @param {string} options.jobId - Job ID for cost tracking
 * @returns {Promise<Object>} Extracted products
 */
export async function extractProducts({
  instructions,
  pdfData,
  urlData,
  category,
  generateSEO = true,
  jobId
}) {
  console.log('[GEMINI_RESEARCH] Starting product extraction...');
  
  // Build the prompt
  let enhancedInstructions = instructions || '';
  
  if (category && category !== 'auto') {
    enhancedInstructions += `\n\nIMPORTANT: All products should be categorized as "${category}".`;
  }
  
  if (generateSEO) {
    enhancedInstructions += '\n\nGenerate detailed, SEO-friendly descriptions (150-300 words) for each product.';
  }
  
  const userPrompt = buildUserPrompt({
    instructions: enhancedInstructions,
    pdfData,
    urlData
  });
  
  // Estimate product count for model selection
  const estimatedProducts = (instructions?.match(/add|import|extract/gi) || []).length || 5;
  const contentLength = userPrompt.length;
  const model = selectModel(contentLength, estimatedProducts);
  
  console.log(`[GEMINI_RESEARCH] Using model: ${model}, content length: ${contentLength}`);
  
  const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;
  
  try {
    const startTime = Date.now();
    
    const response = await gemini.models.generateContent({
      model,
      contents: {
        parts: [{ text: fullPrompt }]
      },
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent structured output
        maxOutputTokens: 8000, // Allow longer output for multiple products
        topP: 0.9,
        topK: 40
      },
      tools: [{
        googleSearchRetrieval: {} // Enable search grounding
      }]
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
    
    console.log(`[GEMINI_RESEARCH] Response received in ${executionTime}ms`);
    
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
            endpoint: '/api/admin/product-research',
            jobId,
            executionTime,
            productCount: estimatedProducts
          }
        );
        console.log(`[GEMINI_RESEARCH] Tokens: ${promptTokenCount} in, ${candidatesTokenCount} out, Cost: $${geminiCost.toFixed(6)}`);
      }
    }
    
    // Parse the response
    const result = parseResponse(responseText);
    
    console.log(`[GEMINI_RESEARCH] Extracted ${result.products.length} products`);
    
    return {
      ...result,
      model,
      executionTime,
      cost: geminiCost
    };
    
  } catch (error) {
    console.error('[GEMINI_RESEARCH] Error:', error.message);
    
    return {
      products: [],
      errors: [error.message],
      suggestions: ['Check if the PDF/URL content is readable', 'Try with fewer products'],
      model,
      executionTime: 0
    };
  }
}

/**
 * Generate SEO description for a single product
 */
export async function generateProductDescription(product) {
  const prompt = `Generate a professional, SEO-friendly product description (150-200 words) for:

Product: ${product.name}
Category: ${product.category || 'building materials'}
Current Description: ${product.description || 'None'}
Highlights: ${(product.highlights || []).join(', ')}
Material: ${product.material || product.variants?.[0]?.material || 'Unknown'}

Write a compelling description that:
1. Starts with the product name naturally
2. Highlights key features and benefits
3. Mentions use cases and applications
4. Uses professional tone suitable for contractors and architects
5. Includes relevant keywords for SEO

Return ONLY the description text, no other formatting.`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 400
      }
    });
    
    let description = '';
    if (response.response?.candidates?.[0]?.content?.parts) {
      description = response.response.candidates[0].content.parts
        .map(part => part.text)
        .join('');
    }
    
    return description.trim();
    
  } catch (error) {
    console.error('[GEMINI_RESEARCH] Description generation error:', error.message);
    return product.description || '';
  }
}

/**
 * Enhance product data with additional search results
 */
export async function enrichProductWithSearch(product) {
  const searchPrompt = `Search for information about "${product.name}" in the building materials/construction industry.

Find and return as JSON:
{
  "specifications": { "key": "value" },
  "typical_price_range": { "low": number, "high": number },
  "common_materials": ["material1", "material2"],
  "use_cases": ["use1", "use2"],
  "brand_info": "string or null"
}

If you cannot find specific information, return null for that field.`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: searchPrompt }] },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500
      },
      tools: [{
        googleSearchRetrieval: {}
      }]
    });
    
    let responseText = '';
    if (response.response?.candidates?.[0]?.content?.parts) {
      responseText = response.response.candidates[0].content.parts
        .map(part => part.text)
        .join('');
    }
    
    // Try to parse JSON
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Ignore parse errors
    }
    
    return null;
    
  } catch (error) {
    console.error('[GEMINI_RESEARCH] Enrichment error:', error.message);
    return null;
  }
}

/**
 * Validate and suggest corrections for product data
 */
export async function validateProductData(product) {
  const prompt = `Review this product data for a building materials catalog and identify any issues:

${JSON.stringify(product, null, 2)}

Return as JSON:
{
  "isValid": true/false,
  "issues": ["issue1", "issue2"],
  "suggestions": {
    "field_name": "suggested_correction"
  },
  "confidence": 0.0-1.0
}`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 300
      }
    });
    
    let responseText = '';
    if (response.response?.candidates?.[0]?.content?.parts) {
      responseText = response.response.candidates[0].content.parts
        .map(part => part.text)
        .join('');
    }
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { isValid: true, issues: [], suggestions: {}, confidence: 0.8 };
    
  } catch (error) {
    console.error('[GEMINI_RESEARCH] Validation error:', error.message);
    return { isValid: true, issues: [], suggestions: {}, confidence: 0.5 };
  }
}

export default {
  extractProducts,
  generateProductDescription,
  enrichProductWithSearch,
  validateProductData
};
