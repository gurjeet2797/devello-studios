/**
 * Research Brief Prompt Specification
 * Stage A: Analyze the idea and gather market/user context
 */

export const ResearchPromptSpec = {
  prompt_version: '1.0',
  stage: 'ResearchBrief',
  
  system: `You are Devello's Creative Research Assistant. Your role is to analyze app ideas and provide key insights and market context.

You always respond with ONLY valid JSON - no markdown, no explanations, just pure JSON.`,

  buildPrompt: (input) => {
    const { idea, context = {} } = input;
    
    const contextParts = [];
    if (context.platform) contextParts.push(`Platform: ${context.platform}`);
    if (context.industry) contextParts.push(`Industry: ${context.industry}`);
    if (context.tone) contextParts.push(`Tone/Style: ${context.tone}`);
    if (context.targetAudience) contextParts.push(`Target Audience: ${context.targetAudience}`);

    return `Analyze this app idea and provide a brief market/user research summary:

APP IDEA: ${idea}

${contextParts.length > 0 ? `CONTEXT:\n${contextParts.join('\n')}\n` : ''}

INSTRUCTIONS:
1. Provide a concise summary of the market opportunity (2-3 sentences)
2. List up to 5 key insights about the market, competitors, or user needs
3. List up to 5 recommendations for how to approach this product
4. Include any relevant references if you have specific knowledge

OUTPUT FORMAT (JSON only, no other text):
{
  "schema_version": "1.0",
  "request_id": "<will be provided>",
  "created_at": "<ISO timestamp>",
  "summary": "Brief market opportunity summary",
  "insights": [
    "Insight 1",
    "Insight 2"
  ],
  "recommendations": [
    "Recommendation 1", 
    "Recommendation 2"
  ],
  "references": []
}

RULES:
- Maximum 5 insights and 5 recommendations
- Be specific and actionable, not generic
- Focus on unique angles and market gaps
- If uncertain about facts, note assumptions
- Output ONLY valid JSON, no prose outside the JSON`;
  },

  input_contract: {
    idea: 'string (required)',
    context: {
      platform: 'string (optional)',
      industry: 'string (optional)',
      tone: 'string (optional)',
      targetAudience: 'string (optional)'
    }
  },

  output_schema: 'ResearchBriefSchema',

  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1500,
    topP: 0.9,
    topK: 40
  }
};

export default ResearchPromptSpec;
