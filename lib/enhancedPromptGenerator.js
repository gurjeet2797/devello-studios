import { createLogger } from './logger.js';

const logger = createLogger('enhanced-prompt-generator');

/**
 * Enhanced Prompt Generator for General Edit Tool
 * Provides context-aware, intelligent prompt generation based on hotspots and image analysis
 */

export class EnhancedPromptGenerator {
  constructor() {
    this.promptTemplates = {
      // Object removal/enhancement
      objectRemoval: {
        person: "Remove the person from this image while maintaining natural background and lighting",
        object: "Remove the specified object from this image while preserving the surrounding environment",
        text: "Remove all text, signs, or written content from this image",
        background: "Remove or replace the background while keeping the main subject intact"
      },
      
      // Enhancement prompts
      enhancement: {
        quality: "Enhance the overall quality, sharpness, and clarity of this image",
        lighting: "Improve the lighting and exposure while maintaining natural colors",
        color: "Enhance the colors, saturation, and vibrancy of this image",
        detail: "Enhance fine details and textures throughout the image"
      },
      
      // Style changes
      style: {
        artistic: "Apply an artistic, painterly style to this image",
        vintage: "Give this image a vintage, retro aesthetic",
        modern: "Apply a modern, clean, contemporary style",
        dramatic: "Create a more dramatic, cinematic look"
      },
      
      // Specific edits
      specific: {
        sky: "Enhance or replace the sky with a more dramatic, beautiful sky",
        face: "Enhance facial features and skin quality",
        landscape: "Improve the landscape and natural elements",
        architecture: "Enhance architectural details and structure"
      }
    };
  }

  /**
   * Generate an enhanced prompt based on hotspots and context
   * @param {Array} hotspots - Array of hotspot objects with x, y, prompt
   * @param {Object} imageContext - Image analysis context (optional)
   * @param {string} basePrompt - User's base prompt (optional)
   * @returns {string} Enhanced prompt
   */
  generateEnhancedPrompt(hotspots = [], imageContext = null, basePrompt = '') {
    logger.info('Generating enhanced prompt', { 
      hotspotCount: hotspots.length,
      hasImageContext: !!imageContext,
      hasBasePrompt: !!basePrompt
    });

    // If user provided a custom prompt, use it as base
    if (basePrompt && basePrompt.trim()) {
      return this.buildCustomPrompt(basePrompt, hotspots);
    }

    // Analyze hotspots to determine edit type
    const editType = this.analyzeHotspotIntent(hotspots);
    logger.info('Detected edit type', { editType });

    // Generate context-aware prompt
    const contextPrompt = this.buildContextPrompt(editType, hotspots, imageContext);
    
    // Add quality and technical requirements
    const technicalRequirements = this.getTechnicalRequirements();
    
    return `${contextPrompt}\n\n${technicalRequirements}`;
  }

  /**
   * Analyze hotspots to determine the user's intent
   * @param {Array} hotspots - Array of hotspot objects
   * @returns {string} Detected edit type
   */
  analyzeHotspotIntent(hotspots) {
    if (!hotspots || hotspots.length === 0) {
      return 'general_enhancement';
    }

    // Analyze hotspot prompts for keywords
    const allPrompts = hotspots.map(h => h.prompt?.toLowerCase() || '').join(' ');
    
    // Detection patterns
    const patterns = {
      removal: ['remove', 'delete', 'erase', 'get rid of', 'eliminate', 'take out'],
      enhancement: ['enhance', 'improve', 'better', 'sharper', 'clearer', 'brighter'],
      style: ['artistic', 'vintage', 'modern', 'dramatic', 'cinematic', 'painterly'],
      color: ['color', 'saturation', 'vibrant', 'bright', 'dark', 'contrast'],
      lighting: ['light', 'dark', 'bright', 'shadow', 'exposure', 'illumination'],
      sky: ['sky', 'cloud', 'sunset', 'sunrise', 'weather'],
      face: ['face', 'skin', 'portrait', 'person', 'people'],
      object: ['object', 'item', 'thing', 'element']
    };

    // Score each category
    const scores = {};
    Object.keys(patterns).forEach(category => {
      scores[category] = patterns[category].reduce((score, keyword) => {
        return score + (allPrompts.includes(keyword) ? 1 : 0);
      }, 0);
    });

    // Find highest scoring category
    const topCategory = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );

    logger.info('Hotspot analysis results', { scores, topCategory });
    return topCategory;
  }

  /**
   * Build context-aware prompt based on edit type and hotspots
   * @param {string} editType - Type of edit detected
   * @param {Array} hotspots - Hotspot array
   * @param {Object} imageContext - Image analysis context
   * @returns {string} Context prompt
   */
  buildContextPrompt(editType, hotspots, imageContext) {
    const baseInstructions = [
      "Apply the requested edits to this image with high quality and attention to detail.",
      "Maintain the original composition, lighting, and overall aesthetic.",
      "Ensure the result looks natural and realistic."
    ];

    let specificInstructions = [];

    // Add specific instructions based on edit type
    switch (editType) {
      case 'removal':
        specificInstructions = [
          "Remove the specified objects or elements while seamlessly blending the background.",
          "Ensure no traces or artifacts remain from the removed elements.",
          "Maintain natural lighting and shadows in the edited areas."
        ];
        break;

      case 'enhancement':
        specificInstructions = [
          "Enhance the overall quality and visual appeal of the image.",
          "Improve sharpness, clarity, and detail while maintaining natural appearance.",
          "Preserve the original color balance and composition."
        ];
        break;

      case 'style':
        specificInstructions = [
          "Apply the requested style transformation while preserving the main subject.",
          "Maintain the original composition and key elements.",
          "Ensure the style change looks natural and well-integrated."
        ];
        break;

      case 'color':
        specificInstructions = [
          "Enhance colors and saturation while maintaining natural appearance.",
          "Improve color balance and contrast.",
          "Preserve skin tones and natural colors."
        ];
        break;

      case 'lighting':
        specificInstructions = [
          "Improve lighting and exposure while maintaining natural look.",
          "Enhance shadows and highlights appropriately.",
          "Preserve the original mood and atmosphere."
        ];
        break;

      default:
        specificInstructions = [
          "Apply the requested modifications with high quality and attention to detail.",
          "Ensure the result looks natural and professional."
        ];
    }

    // Add hotspot-specific instructions
    if (hotspots && hotspots.length > 0) {
      const hotspotInstructions = hotspots.map((hotspot, index) => {
        const prompt = hotspot.prompt?.trim();
        if (prompt) {
          return `Hotspot ${index + 1} (${hotspot.x}%, ${hotspot.y}%): ${prompt}`;
        }
        return `Hotspot ${index + 1} (${hotspot.x}%, ${hotspot.y}%): Apply enhancement to this area`;
      });

      specificInstructions.push(`Specific areas to focus on:\n${hotspotInstructions.join('\n')}`);
    }

    return [...baseInstructions, ...specificInstructions].join('\n');
  }

  /**
   * Build custom prompt with hotspot context
   * @param {string} basePrompt - User's custom prompt
   * @param {Array} hotspots - Hotspot array
   * @returns {string} Enhanced custom prompt
   */
  buildCustomPrompt(basePrompt, hotspots) {
    const baseInstructions = [
      basePrompt,
      "Maintain the original image dimensions and composition.",
      "Ensure high quality and realistic results."
    ];

    if (hotspots && hotspots.length > 0) {
      const hotspotContext = hotspots.map((hotspot, index) => {
        const prompt = hotspot.prompt?.trim();
        if (prompt) {
          return `Focus area ${index + 1} (${hotspot.x}%, ${hotspot.y}%): ${prompt}`;
        }
        return `Focus area ${index + 1} (${hotspot.x}%, ${hotspot.y}%): Apply enhancement`;
      });

      baseInstructions.push(`\nSpecific focus areas:\n${hotspotContext.join('\n')}`);
    }

    return baseInstructions.join('\n');
  }

  /**
   * Get technical requirements for the prompt
   * @returns {string} Technical requirements
   */
  getTechnicalRequirements() {
    return `TECHNICAL REQUIREMENTS:
- Maintain the EXACT same image dimensions and aspect ratio as the original
- Do NOT crop, resize, or change the composition of the original image
- Preserve the original composition, structure, and layout completely
- Keep all elements in their original positions and proportions
- The output must be identical in size and composition to the input image
- Only modify the specific areas requested, leave everything else unchanged
- Maintain high quality and realistic results
- Output a lossless PNG at original resolution with identical dimensions`;
  }

  /**
   * Validate hotspot placement and provide suggestions
   * @param {Array} hotspots - Hotspot array
   * @param {Object} imageContext - Image analysis context
   * @returns {Object} Validation results
   */
  validateHotspots(hotspots, imageContext) {
    const validation = {
      isValid: true,
      warnings: [],
      suggestions: []
    };

    if (!hotspots || hotspots.length === 0) {
      validation.warnings.push('No hotspots placed. Consider adding specific areas to edit.');
      return validation;
    }

    // Check for hotspots too close to edges
    hotspots.forEach((hotspot, index) => {
      if (hotspot.x < 5 || hotspot.x > 95 || hotspot.y < 5 || hotspot.y > 95) {
        validation.warnings.push(`Hotspot ${index + 1} is very close to the image edge. Consider moving it slightly inward.`);
      }
    });

    // Check for hotspots too close together
    for (let i = 0; i < hotspots.length; i++) {
      for (let j = i + 1; j < hotspots.length; j++) {
        const distance = Math.sqrt(
          Math.pow(hotspots[i].x - hotspots[j].x, 2) + 
          Math.pow(hotspots[i].y - hotspots[j].y, 2)
        );
        if (distance < 10) {
          validation.warnings.push(`Hotspots ${i + 1} and ${j + 1} are very close together. Consider spacing them out.`);
        }
      }
    }

    // Check for empty prompts
    const emptyPrompts = hotspots.filter(h => !h.prompt || h.prompt.trim() === '');
    if (emptyPrompts.length > 0) {
      validation.suggestions.push('Consider adding specific descriptions to your hotspots for better results.');
    }

    return validation;
  }

  /**
   * Generate prompt suggestions based on image analysis
   * @param {Object} imageContext - Image analysis context
   * @returns {Array} Array of prompt suggestions
   */
  generatePromptSuggestions(imageContext) {
    const suggestions = [];

    if (!imageContext) {
      return [
        "Enhance the overall quality and sharpness",
        "Improve the lighting and exposure",
        "Enhance colors and saturation",
        "Remove unwanted objects or elements"
      ];
    }

    // Add context-specific suggestions
    if (imageContext.hasPeople) {
      suggestions.push("Enhance facial features and skin quality");
    }
    
    if (imageContext.hasSky) {
      suggestions.push("Enhance or replace the sky");
    }
    
    if (imageContext.hasArchitecture) {
      suggestions.push("Enhance architectural details");
    }
    
    if (imageContext.hasLandscape) {
      suggestions.push("Improve landscape and natural elements");
    }

    // Add general suggestions
    suggestions.push(
      "Enhance the overall quality and sharpness",
      "Improve the lighting and exposure",
      "Enhance colors and saturation"
    );

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }
}

// Export singleton instance
export const enhancedPromptGenerator = new EnhancedPromptGenerator();
