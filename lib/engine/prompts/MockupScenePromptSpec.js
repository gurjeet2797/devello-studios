/**
 * Mockup Scene Composition Prompt Specification
 * Stage E: Create Devello Product Showcase mockup
 */

export const MockupScenePromptSpec = {
  prompt_version: '2.0',
  stage: 'MockupScene',
  
  system: `You are Devello's Creative Director. You design elegant product showcase mockups that tell a story.
Respond with ONLY valid JSON - no markdown, no explanations.`,

  buildPrompt: (input) => {
    const { screens, product_concept, research_brief } = input;
    
    const productName = product_concept?.name || 'Mobile App';
    const productDescription = product_concept?.description || product_concept?.tagline || 'A modern mobile application';
    
    // Create screen descriptions based on research and concept
    const screenDescriptions = screens?.map((s, i) => {
      const screenPurpose = s.context || s.name || `Screen ${i + 1}`;
      return `${screenPurpose}`;
    }).join(', ') || 'App interface screens';

    const screen1Desc = screens?.[0]?.context || 'Dashboard view showing main features and navigation';
    const screen2Desc = screens?.[1]?.context || 'Detail view with content and interactions';
    const screen3Desc = screens?.[2]?.context || 'Mobile-optimized interface with key actions';
    const screen4Desc = screens?.[3]?.context || 'Quick glance view with essential information';
    const shortDesc = productDescription.substring(0, 60);

    return `Create a Devello Product Showcase mockup for "${productName}".

PRODUCT INFO:
- Name: ${productName}
- Description: ${productDescription}
- Screens: ${screenDescriptions}

RESEARCH CONTEXT:
${research_brief?.summary ? `- ${research_brief.summary.substring(0, 200)}` : ''}
${research_brief?.insights?.[0] ? `- Key insight: ${research_brief.insights[0]}` : ''}

OUTPUT (JSON only, no template strings - use actual values):
{
  "template_name": "Devello Product Showcase",
  "style": {
    "theme": "Minimalist",
    "background_color": "#F2F2F2",
    "alignment": "Center",
    "vibe": "Professional, Clean, Modern"
  },
  "layout": {
    "header_section": {
      "logo_placement": "Top Left",
      "title_placement": "Center Middle",
      "subtitle_placement": "Center Middle, below title"
    },
    "mockup_section": {
      "arrangement": "Horizontal Row",
      "alignment": "Bottom Aligned",
      "devices_order": ["Laptop", "Tablet", "Smartphone", "Smartwatch"]
    }
  },
  "text_elements": [
    {
      "id": "brand_logo",
      "text": "Devello",
      "font_family": "Pacifico",
      "font_weight": "Regular",
      "color": "#000000",
      "size": "Small",
      "position": { "x": "5%", "y": "5%" }
    },
    {
      "id": "main_heading",
      "text": "${productName}",
      "font_family": "Geometric Sans-Serif",
      "font_weight": "Bold",
      "color": "#000000",
      "size": "Large (approx 64px)",
      "position": "Center"
    },
    {
      "id": "sub_heading",
      "text": "${shortDesc}",
      "font_family": "Geometric Sans-Serif",
      "font_weight": "Semi-Bold",
      "color": "#000000",
      "size": "Medium (approx 18px)",
      "position": "Center, 20px below main_heading"
    }
  ],
  "visual_elements": [
    {
      "device": "Laptop (MacBook Pro Style)",
      "screen_content": "${screen1Desc}",
      "orientation": "Front facing"
    },
    {
      "device": "Tablet (iPad Pro Style)",
      "screen_content": "${screen2Desc}",
      "orientation": "Portrait",
      "position": "Right of Laptop"
    },
    {
      "device": "Smartphone (iPhone Style)",
      "screen_content": "${screen3Desc}",
      "orientation": "Portrait",
      "position": "Right of Tablet"
    }
  ]
}

RULES:
- Screen content should be creative and descriptive and consistent across all devices, not technical
- Base descriptions on the product concept and research
- Make each device show a different aspect of the app
- Keep descriptions under 100 characters each
- Output actual values, not template strings`;
  },

  input_contract: {
    screens: 'ScreenSpec[] (required, 4 screens)',
    product_concept: 'ProductConcept object (required)',
    research_brief: 'ResearchBrief object (optional)'
  },

  output_schema: 'MockupSceneSchema',

  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2000,
    topP: 0.9
  }
};

export default MockupScenePromptSpec;
