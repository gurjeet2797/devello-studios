/**
 * Product Research Engine Prompt Templates
 * 
 * These prompts are designed for Gemini 2.5 to extract structured
 * product data from PDF catalogs and vendor websites.
 */

/**
 * System prompt for product extraction
 */
export const SYSTEM_PROMPT = `You are Devello's Product Research Engine. Your ONLY purpose is to extract product information for a premium building materials catalog.

Devello sells: windows, doors, glass (shower doors, panels), mirrors, millwork (casing, baseboard, crown molding), lighting fixtures, and bathroom products (vanities, faucets, toilets).

STRICT OUTPUT FORMAT (JSON only, no other text):
{
  "products": [
    {
      "name": "Product Name",
      "description": "Marketing description (150-300 words, SEO-friendly)",
      "price_cents": 63000,
      "category": "windows|doors|glass|mirrors|millwork|lighting|bathroom",
      "variants": [
        {
          "name": "Variant Name (e.g., Black Aluminum Frame)",
          "material": "Material description",
          "price": 63000,
          "imageUrl": "URL if found",
          "notes": "Additional notes"
        }
      ],
      "highlights": ["Feature 1", "Feature 2", "Feature 3"],
      "images": ["url1", "url2"],
      "confidence": 0.95,
      "sources": ["pdf:45", "url:vendor.com/product"]
    }
  ],
  "errors": ["Any errors or issues encountered"],
  "suggestions": ["Suggestions for missing data or improvements"]
}

CRITICAL RULES:
1. Extract ONLY the products specified in the instructions.
2. Price MUST be in cents (e.g., $630.00 = 63000 cents).
3. If information is missing, use Google Search to find it.
4. Flag any product with confidence < 0.8.
5. NEVER fabricate specifications - use "unknown" or leave blank if unsure.
6. DO NOT include any text outside the JSON structure.
7. For millwork (priced per linear foot), note this in the pricing.
8. Always include at least 3 highlights/features per product.
9. Generate SEO-friendly descriptions that include materials, use cases, and benefits.`;

/**
 * Build the user prompt with context from PDF and URL data
 */
export function buildUserPrompt({ instructions, pdfData, urlData }) {
  const parts = [];
  
  // Instructions section
  parts.push('=== EXTRACTION INSTRUCTIONS ===');
  parts.push(instructions || 'Extract all products found in the provided content.');
  parts.push('');
  
  // PDF content section
  if (pdfData && Object.keys(pdfData.textByPage || {}).length > 0) {
    parts.push('=== PDF CATALOG CONTENT ===');
    
    for (const [pageNum, text] of Object.entries(pdfData.textByPage)) {
      if (text && text.trim()) {
        parts.push(`[Page ${pageNum}]:`);
        parts.push(text.substring(0, 4000)); // Limit per page
        parts.push('');
      }
    }
  }
  
  // URL content section
  if (urlData) {
    parts.push('=== VENDOR WEBSITE DATA ===');
    
    if (Array.isArray(urlData)) {
      for (const site of urlData) {
        if (site.url) {
          parts.push(`[${site.url}]:`);
          if (site.name) parts.push(`Name: ${site.name}`);
          if (site.description) parts.push(`Description: ${site.description}`);
          if (site.price) parts.push(`Price: $${(site.price / 100).toFixed(2)}`);
          if (site.images?.length) parts.push(`Images: ${site.images.slice(0, 5).join(', ')}`);
          if (site.rawText) parts.push(`Content: ${site.rawText.substring(0, 2000)}`);
          parts.push('');
        }
      }
    } else if (urlData.url) {
      parts.push(`[${urlData.url}]:`);
      if (urlData.name) parts.push(`Name: ${urlData.name}`);
      if (urlData.description) parts.push(`Description: ${urlData.description}`);
      if (urlData.price) parts.push(`Price: $${(urlData.price / 100).toFixed(2)}`);
      if (urlData.images?.length) parts.push(`Images: ${urlData.images.slice(0, 5).join(', ')}`);
      if (urlData.rawText) parts.push(`Content: ${urlData.rawText.substring(0, 2000)}`);
    }
  }
  
  parts.push('');
  parts.push('=== TASK ===');
  parts.push('Extract product data following the JSON schema exactly. Include all variants, pricing, and images found.');
  
  return parts.join('\n');
}

/**
 * Determine which Gemini model to use based on content complexity
 */
export function selectModel(contentLength, productCount) {
  // Use Flash for simple queries (single product, small content)
  if (productCount <= 2 && contentLength < 5000) {
    return 'gemini-2.5-flash';
  }
  
  // Use Pro for complex queries (many products or large content)
  if (productCount > 5 || contentLength > 20000) {
    return 'gemini-2.5-pro';
  }
  
  // Default to Flash for cost efficiency
  return 'gemini-2.5-flash';
}

/**
 * Parse and validate Gemini response
 */
export function parseResponse(responseText) {
  // Try to extract JSON from the response
  let jsonStr = responseText.trim();
  
  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  
  jsonStr = jsonStr.trim();
  
  try {
    const data = JSON.parse(jsonStr);
    
    // Validate structure
    if (!data.products || !Array.isArray(data.products)) {
      return {
        products: [],
        errors: ['Invalid response structure: missing products array'],
        suggestions: []
      };
    }
    
    // Validate and clean each product
    const validProducts = data.products.map((product, index) => {
      // Ensure required fields
      if (!product.name) {
        product.name = `Unknown Product ${index + 1}`;
        product.confidence = Math.min(product.confidence || 0.5, 0.5);
      }
      
      // Ensure price is in cents
      if (product.price_cents && typeof product.price_cents === 'number') {
        // Already in cents
      } else if (product.price && typeof product.price === 'number') {
        product.price_cents = product.price > 1000 ? product.price : product.price * 100;
      } else {
        product.price_cents = 0;
      }
      
      // Ensure variants have prices in cents
      if (product.variants && Array.isArray(product.variants)) {
        product.variants = product.variants.map(v => ({
          ...v,
          price: typeof v.price === 'number' ? v.price : 0
        }));
      }
      
      // Default values
      return {
        name: product.name,
        description: product.description || '',
        price_cents: product.price_cents || 0,
        category: product.category || 'uncategorized',
        variants: product.variants || [],
        highlights: product.highlights || [],
        images: product.images || [],
        confidence: product.confidence || 0.8,
        sources: product.sources || []
      };
    });
    
    return {
      products: validProducts,
      errors: data.errors || [],
      suggestions: data.suggestions || []
    };
    
  } catch (error) {
    console.error('[PROMPT] Failed to parse response:', error.message);
    
    // Attempt to extract partial JSON
    const jsonMatch = responseText.match(/\{[\s\S]*"products"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Fall through
      }
    }
    
    return {
      products: [],
      errors: [`Failed to parse AI response: ${error.message}`],
      suggestions: ['Try with fewer products or simpler instructions']
    };
  }
}

/**
 * Estimate cost for a prompt
 */
export function estimateCost(promptText, expectedProducts) {
  const inputTokens = Math.ceil(promptText.length / 4); // Rough estimate
  const outputTokens = expectedProducts * 500; // ~500 tokens per product
  
  // Flash pricing: $0.075/1M input, $0.30/1M output
  const flashCost = (inputTokens * 0.000075 + outputTokens * 0.0003) / 1000;
  
  // Pro pricing: $1.25/1M input, $5.00/1M output  
  const proCost = (inputTokens * 0.00125 + outputTokens * 0.005) / 1000;
  
  return {
    inputTokens,
    outputTokens,
    flashCost,
    proCost,
    recommended: flashCost < 0.05 ? 'flash' : 'pro'
  };
}

export default {
  SYSTEM_PROMPT,
  buildUserPrompt,
  selectModel,
  parseResponse,
  estimateCost
};
