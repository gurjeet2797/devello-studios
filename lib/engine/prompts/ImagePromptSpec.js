/**
 * Image Prompt Generation Specification
 * Stage D: Create image generation prompts for each screen
 */

import { DesignSystemDefaults } from '../specs/IdeationSchemas.js';

export const ImagePromptSpec = {
  prompt_version: '1.1',
  stage: 'ImagePrompts',
  
  system: `You are a UI/UX designer creating prompts for AI image generation. Your prompts produce stunning, modern mobile app mockups.

You always respond with ONLY valid JSON - no markdown, no explanations.`,

  buildPrompt: (input) => {
    const { screens, product_concept } = input;
    
    const screensContext = screens.map(s => 
      `Screen ${s.screen_id} (${s.name}): ${s.context}`
    ).join('\n');

    const productName = product_concept?.name || 'Mobile App';

    return `Generate 4 image prompts for "${productName}" mobile app:

SCREENS:
${screensContext}

DESIGN STYLE (CRITICAL - apply to ALL screens):
- Liquid glass / glassmorphism UI with frosted translucent panels
- Soft gradients (subtle blues, purples, warm neutrals)
- NO solid flat colors - everything has depth and blur
- Minimal, airy layouts with generous whitespace  
- Thin elegant typography (SF Pro style)
- Subtle shadows and glows
- Premium iOS aesthetic
- Consistent visual language across all 4 screens
- Same color palette, same glass effect intensity
- Same typography style throughout

OUTPUT FORMAT (JSON only):
{
  "image_prompts": [
    { "screen_id": 1, "prompt": "..." },
    { "screen_id": 2, "prompt": "..." },
    { "screen_id": 3, "prompt": "..." },
    { "screen_id": 4, "prompt": "..." }
  ]
}

PROMPT TEMPLATE (use for each):
"Ultra minimal mobile app UI screenshot, [screen purpose], glassmorphism design with frosted translucent cards, soft gradient background transitioning from [color1] to [color2], thin elegant sans-serif typography, generous whitespace, subtle depth with blur effects, premium iOS aesthetic, [key elements], photorealistic render, 4K quality"

CONSISTENCY RULES:
- Use the SAME gradient colors for all 4 screens
- Use the SAME glass blur intensity for all screens
- Use the SAME typography weight and style
- All screens should look like they're from the same app`;
  },

  input_contract: {
    screens: 'ScreenSpec[] (required, 4 screens)',
    product_concept: 'ProductConcept object (optional)'
  },

  output_schema: 'ImagePromptsOutputSchema',

  generationConfig: {
    temperature: 0.6,
    maxOutputTokens: 1500,
    topP: 0.9
  }
};

export default ImagePromptSpec;
