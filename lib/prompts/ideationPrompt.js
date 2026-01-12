/**
 * Creative Intelligence Engine Prompt Templates (LEGACY)
 * 
 * @deprecated This file is deprecated. Use the new engine at lib/engine instead.
 * 
 * The v2 engine provides:
 * - Multi-stage pipeline (Research → Concept → Screens → Images → Mockup)
 * - JSON schema validation with Joi
 * - Caching and progress tracking
 * - Parallel image generation
 * 
 * See: lib/engine/index.js
 * 
 * This file is maintained for backward compatibility only.
 */

console.warn('[DEPRECATED] lib/prompts/ideationPrompt.js is deprecated. Use lib/engine instead.');

/**
 * System prompt for ideation
 */
export const SYSTEM_PROMPT = `You are Devello's Creative Intelligence Engine. Your purpose is to transform simple app ideas into complete, professional product concepts.

Devello builds custom software solutions for clients. When given a one-sentence app idea, you must generate a comprehensive product concept that includes:

1. Product name and tagline
2. Core features (7 maximum)
3. Technology stack recommendations (frontend, backend, database, integrations)
4. Monetization strategy
5. Development roadmap (6 milestones maximum)
6. UI/UX inspiration notes

STRICT OUTPUT FORMAT (JSON only, no other text):
{
  "name": "Product Name",
  "tagline": "One-line compelling description",
  "features": [
    "Feature 1",
    "Feature 2",
    "Feature 3",
    ...
  ],
  "tech_stack": {
    "frontend": "Recommended frontend framework/stack",
    "backend": "Recommended backend technology",
    "database": "Recommended database solution",
    "integrations": [
      "Integration 1",
      "Integration 2",
      ...
    ]
  },
  "monetization": "Detailed monetization strategy (2-3 sentences)",
  "roadmap": [
    "Phase 1: Milestone description",
    "Phase 2: Milestone description",
    ...
  ],
  "ui_inspiration": "Brief notes on UI/UX direction and inspiration"
}

CRITICAL RULES:
1. Generate realistic, actionable features based on the idea.
2. Recommend modern, proven technology stacks.
3. Provide practical monetization strategies (subscription, freemium, marketplace, etc.).
4. Create a phased roadmap that shows logical progression.
5. Keep features list to 7 items maximum.
6. Keep roadmap to 6 milestones maximum.
7. Keep integrations list to 6 items maximum.
8. DO NOT include any text outside the JSON structure.
9. Be specific and professional - avoid generic responses.
10. Consider the target audience and platform when making recommendations.`;

/**
 * Build the user prompt with idea and context
 */
export function buildUserPrompt(prompt, context = {}) {
  const parts = [];
  
  parts.push('=== APP IDEA ===');
  parts.push(prompt);
  parts.push('');
  
  if (context.platform || context.industry || context.tone || context.targetAudience) {
    parts.push('=== ADDITIONAL CONTEXT ===');
    
    if (context.platform) {
      parts.push(`Platform: ${context.platform}`);
    }
    if (context.industry) {
      parts.push(`Industry: ${context.industry}`);
    }
    if (context.targetAudience) {
      parts.push(`Target Audience: ${context.targetAudience}`);
    }
    if (context.tone) {
      parts.push(`Tone/Style: ${context.tone}`);
    }
    parts.push('');
  }
  
  parts.push('=== TASK ===');
  parts.push('Generate a complete product concept following the JSON schema exactly. Make it professional, actionable, and tailored to the idea provided.');
  
  return parts.join('\n');
}

/**
 * Determine which Gemini model to use based on prompt complexity
 */
export function selectModel(promptLength) {
  // Use Flash for simple ideas (short prompts)
  if (promptLength < 200) {
    return 'gemini-2.5-flash';
  }
  
  // Use Pro for complex ideas (longer prompts or with context)
  if (promptLength > 500) {
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
    
    // Validate and normalize structure
    const result = {
      name: data.name || '',
      tagline: data.tagline || '',
      features: Array.isArray(data.features) 
        ? data.features.slice(0, 7).map(f => String(f || '').trim()).filter(Boolean)
        : [],
      tech_stack: {
        frontend: data.tech_stack?.frontend || '',
        backend: data.tech_stack?.backend || '',
        database: data.tech_stack?.database || '',
        integrations: Array.isArray(data.tech_stack?.integrations)
          ? data.tech_stack.integrations.slice(0, 6).map(i => String(i || '').trim()).filter(Boolean)
          : []
      },
      monetization: data.monetization || '',
      roadmap: Array.isArray(data.roadmap)
        ? data.roadmap.slice(0, 6).map(r => String(r || '').trim()).filter(Boolean)
        : [],
      ui_inspiration: data.ui_inspiration || ''
    };
    
    return result;
    
  } catch (error) {
    console.error('[IDEATION_PROMPT] Failed to parse response:', error.message);
    
    // Attempt to extract partial JSON
    const jsonMatch = responseText.match(/\{[\s\S]*"name"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return parseResponse(jsonMatch[0]);
      } catch {
        // Fall through
      }
    }
    
    // Return default structure on parse failure
    return {
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
    };
  }
}

export default {
  SYSTEM_PROMPT,
  buildUserPrompt,
  selectModel,
  parseResponse
};
