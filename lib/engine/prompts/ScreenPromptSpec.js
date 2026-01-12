/**
 * Screen Specifications Prompt
 * Stage C: Define 4 core app screens based on product concept
 */

import { DesignSystemDefaults } from '../specs/IdeationSchemas.js';

export const ScreenPromptSpec = {
  prompt_version: '1.0',
  stage: 'ScreenSpecs',
  
  system: `You are Devello's UI/UX Design Assistant. Your role is to define screen specifications for mobile app interfaces.

You always respond with ONLY valid JSON - no markdown, no explanations, just pure JSON.`,

  buildPrompt: (input) => {
    const { product_concept, design_system = DesignSystemDefaults } = input;
    
    const { name, tagline, features, ui_inspiration } = product_concept;
    const featuresList = features?.slice(0, 5).join('\n- ') || 'Core app features';

    return `Define 4 core mobile app screens for this product:

PRODUCT: ${name}
TAGLINE: ${tagline}

KEY FEATURES:
- ${featuresList}

UI DIRECTION: ${ui_inspiration}

DESIGN SYSTEM:
- Style: ${design_system.component_style?.style || 'modern_minimal'}
- Primary Color: ${design_system.color_palette?.primary || '#4A90E2'}
- Border Radius: ${design_system.component_style?.border_radius || '12px'}
- Typography: ${design_system.typography?.font_family || 'Inter, system-ui'}

INSTRUCTIONS:
1. Define exactly 4 screens: Home, Detail, Dashboard, and Profile
2. For each screen, provide a context description and list of UI elements
3. Ensure screens collectively cover the major features
4. Maintain consistent design direction across all screens

OUTPUT FORMAT (JSON only, no other text):
{
  "schema_version": "1.0",
  "request_id": "<will be provided>",
  "created_at": "<ISO timestamp>",
  "screens": [
    {
      "screen_id": 1,
      "name": "Home",
      "context": "Description of what this screen shows and does",
      "elements": [
        "Element 1 (e.g., search bar, navigation)",
        "Element 2",
        "Element 3"
      ]
    },
    {
      "screen_id": 2,
      "name": "Detail",
      "context": "...",
      "elements": ["..."]
    },
    {
      "screen_id": 3,
      "name": "Dashboard",
      "context": "...",
      "elements": ["..."]
    },
    {
      "screen_id": 4,
      "name": "Profile",
      "context": "...",
      "elements": ["..."]
    }
  ]
}

RULES:
- Exactly 4 screens required (Home, Detail, Dashboard, Profile)
- Screen IDs must be 1, 2, 3, 4
- Each screen needs 3-8 UI elements
- Keep context descriptions concise (1-2 sentences)
- Elements should be specific UI components
- Output ONLY valid JSON, no prose outside the JSON`;
  },

  input_contract: {
    product_concept: 'ProductConcept object (required)',
    design_system: 'DesignSystemDefaults object (optional)'
  },

  output_schema: 'ScreenSpecsOutputSchema',

  generationConfig: {
    temperature: 0.6,
    maxOutputTokens: 1500,
    topP: 0.9,
    topK: 40
  }
};

export default ScreenPromptSpec;
