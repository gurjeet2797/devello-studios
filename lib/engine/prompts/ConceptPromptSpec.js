/**
 * Product Concept Prompt Specification
 * Stage B: Generate focused product concept
 */

export const ConceptPromptSpec = {
  prompt_version: '1.2',
  stage: 'ProductConcept',
  
  system: `You are a creative product strategist. You craft elegant app concepts with memorable names.
Respond with ONLY valid JSON - no markdown, no explanations.`,

  buildPrompt: (input) => {
    const { idea, context = {} } = input;
    
    const ctx = [];
    if (context.platform) ctx.push(`Platform: ${context.platform}`);
    if (context.industry) ctx.push(`Industry: ${context.industry}`);

    return `Create an app concept for:

"${idea}"

${ctx.length > 0 ? ctx.join(' | ') : ''}

OUTPUT (JSON only):
{
  "name": "Two Words",
  "tagline": "Short catchy tagline",
  "description": "1 sentence compact description (20-40 words) of what the app does and who it's for"
}

NAMING RULES (CRITICAL):
- Name MUST be exactly TWO words with a SPACE between them (like: "Sky Flow", "Night Owl", "Pulse Wave", "Dream Forge", "Cloud Nest")
- Be creative and poetic, not literal
- Name should feel premium and harmonious
- Examples: "Mind Bloom", "Vault Key", "Thread Weave", "Lunar Sync"

DESCRIPTION RULES:
- Keep it VERY SHORT: 1 sentence maximum (20-40 words)
- Elegant, conversational tone
- Focus on the feeling and experience, not features
- Make it sound exciting but not salesy
- Be extremely concise - every word counts`;
  },

  input_contract: {
    idea: 'string (required)',
    context: 'object (optional)'
  },

  output_schema: 'ProductConceptSchema',

  generationConfig: {
    temperature: 0.8,
    maxOutputTokens: 600,
    topP: 0.9
  }
};

export default ConceptPromptSpec;
