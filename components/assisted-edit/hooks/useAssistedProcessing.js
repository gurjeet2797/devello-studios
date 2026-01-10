import { useState } from 'react';

export const useAssistedProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processAssistedEdit = async ({ hotspots, referenceImages, originalImageUrl }) => {
    if (!originalImageUrl) {
      throw new Error('No original image URL provided');
    }

    if (!hotspots || hotspots.length === 0) {
      throw new Error('No hotspots provided');
    }

    const hotspotsWithReferences = hotspots.filter(hotspot => 
      referenceImages[hotspot.id]
    );

    if (hotspotsWithReferences.length === 0) {
      throw new Error('No hotspots with reference images found');
    }

    return {
      totalHotspots: hotspots.length,
      hotspotsWithReferences: hotspotsWithReferences.length,
      originalImageUrl
    };

    setIsProcessing(true);

    try {
      // Prepare the combined prompt for all hotspots with references
      const combinedPrompt = hotspotsWithReferences.map((hotspot, index) => {
        const referenceImage = referenceImages[hotspot.id];
        return `Edit ${index + 1}: At coordinates (${hotspot.x}%, ${hotspot.y}%) - ${hotspot.prompt || 'apply reference image style'} using the provided reference image`;
      }).join('\n');

      const optimizedPrompt = `Please apply the following targeted edits to the image:

${combinedPrompt}

CRITICAL REQUIREMENTS FOR REFERENCE IMAGES:
- Maintain the EXACT same dimensions as the original image
- Do NOT crop, resize, or change the aspect ratio
- Apply the reference image style/elements at the specified coordinates
- Blend seamlessly with the existing image
- Preserve the original image's composition and framing

Process all edits in a single operation for consistency.`;

      console.log('Processing assisted edit with reference images:', {
        hotspots: hotspotsWithReferences,
        combinedPrompt,
        optimizedPrompt,
        imageUrl: originalImageUrl
      });

      // Create the prediction with reference images using Gemini API directly
      const { apiPost } = await import('../../../lib/apiClient');
      const response = await apiPost('/api/predictions/general-edit', {
        imageUrl: originalImageUrl,
        prompt: optimizedPrompt,
        referenceImages: hotspotsWithReferences.map(hotspot => ({
          ...referenceImages[hotspot.id],
          selectionPoint: { x: hotspot.x, y: hotspot.y }
        }))
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const prediction = await response.json();


      return prediction;

    } catch (error) {
      console.error('❌ [ASSISTED_PROCESSING] Assisted edit processing failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processAssistedEdit,
    isProcessing
  };
};
