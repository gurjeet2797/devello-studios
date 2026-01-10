import { useCallback } from 'react';
import { getSupabase } from '../../../lib/supabaseClient';

export const useAIImageProcessing = (updateState, user, setUserData, uploadId, markUploadAsProcessed, refreshAfterUpload, processingImageUrl, containerDims, originalImageForComparison, originalSrc, onSessionComplete = null) => {
  
  // Handle image upscaling
  const handleUpscale = useCallback(async (imageUrl) => {
    if (!imageUrl) return;
    
    updateState({ 
      upscaleError: null,
      isUpscaling: true 
    });
    
    try {
      let finalImageUrl = imageUrl;
      
      // If it's a data URL, convert to file and upload first
      if (imageUrl.startsWith('data:')) {
        console.log('📤 Converting data URL to file for upscaling...');
        
        // Convert data URL to blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Create file from blob
        const file = new File([blob], 'upscale-input.jpg', { type: 'image/jpeg' });
        
        // Upload file
        const formData = new FormData();
        formData.append('file', file);
        
        // Get the session token from Supabase with error handling
        const supabase = getSupabase();
        if (!supabase) {
          throw new Error('Supabase client not available');
        }
        
        let session = null;
        try {
          const { data: { session: sessionData } } = await supabase.auth.getSession();
          session = sessionData;
        } catch (sessionError) {
          console.warn('⚠️ [UPSCALE] Session retrieval failed:', sessionError.message);
          // Continue without auth headers if session retrieval fails
        }
        
        const headers = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          headers
        });
       
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image for upscaling');
        }
        
        const uploadResult = await uploadResponse.json();
        finalImageUrl = uploadResult.url;
        console.log('✅ Image uploaded for upscaling:', finalImageUrl);
        
        // Dispatch event to notify unified upload system
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('uploadRecorded', {
            detail: { uploadId: uploadResult.uploadId, uploadType: 'upscale' }
          }));
        }
      }
      
      // Retry logic for upscale API call
      let response;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`🔄 Upscale attempt ${retryCount + 1}/${maxRetries}`);
          
          response = await fetch('/api/predictions/upscale', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              image: finalImageUrl,
              scale: 2 
            }),
          });
          
          if (response.ok) {
            console.log('✅ Upscale API call successful');
            break;
          }
          
          const errorText = await response.text();
          console.error(`❌ Upscale API error: ${response.status} - ${errorText}`);
          
          if (response.status === 429) {
            // Rate limited, wait and retry with exponential backoff
            retryCount++;
            if (retryCount < maxRetries) {
              const delay = Math.min(retryCount * 2000, 8000); // 2s, 4s, 6s delays
              console.log(`⏳ Rate limited, retrying in ${delay/1000} seconds... (attempt ${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          
          // If not 429, throw error immediately
          throw new Error(`Failed to upscale image: ${response.status} - ${errorText}`);
        } catch (error) {
          retryCount++;
          console.error(`❌ Upscale attempt ${retryCount} failed:`, error.message);
          
          if (retryCount < maxRetries && (error.message.includes('429') || error.message.includes('Failed to upscale image: 429'))) {
            const delay = Math.min(retryCount * 2000, 8000);
            console.log(`⏳ Network error, retrying in ${delay/1000} seconds... (attempt ${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw error;
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Failed to upscale image after ${maxRetries} attempts`);
      }
      
      const result = await response.json();
      
      // Set final display sources (upscaling complete)
      // Preserve original container dimensions - do not resize based on upscaled image
      updateState({
        originalSrc: processingImageUrl, // Always keep standardized image for comparison
        processedSrc: result.output,
        upscaledImage: result.output,
        showEnhanced: true,
        isProcessing: false,
        isUpscaling: false
      });
      
    } catch (error) {
      console.error('Upscale error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upscale image. Please try again.';
      
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        errorMessage = 'Server is busy. Please wait a moment and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Upscale request timed out. Please try again.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      updateState({
        upscaleError: errorMessage,
        isProcessing: false,
        isUpscaling: false
      });
    }
  }, [updateState, user, setUserData, containerDims, originalImageForComparison, originalSrc]);

  // Process image with custom prompt (general edit) - now with automatic upscaling
  const processImage = useCallback(async (prompt) => {
    if (!processingImageUrl) {
      return;
    }
    
    console.log('🎨 Starting general edit processing');
    
    // Log the Gemini prompt for debugging
    console.log('🤖 GEMINI PROMPT FOR GENERAL EDIT:', {
      prompt,
      imageUrl: processingImageUrl
    });
    
    updateState({
      isProcessing: true,
      processError: null
    });
    
    try {
      // Phase 3: Enhanced prompt generation for custom prompts
      const imageContext = {
        hasPeople: prompt.toLowerCase().includes('person') || prompt.toLowerCase().includes('face'),
        hasSky: prompt.toLowerCase().includes('sky') || prompt.toLowerCase().includes('cloud'),
        hasArchitecture: prompt.toLowerCase().includes('building') || prompt.toLowerCase().includes('wall'),
        hasLandscape: prompt.toLowerCase().includes('tree') || prompt.toLowerCase().includes('grass'),
        imageDimensions: containerDims ? { width: containerDims.width, height: containerDims.height } : null
      };

      const response = await fetch('/api/predictions/general-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: processingImageUrl,
          prompt: prompt,
          imageContext: imageContext
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to process image: ${response.status} - ${errorText}`);
      }
      
      const prediction = await response.json();
      console.log('⏳ General edit processing started');
      
      // Check if this is a Gemini response (already completed)
      if (prediction.status === 'succeeded' && prediction.output) {
        console.log('✅ General edit processing completed (Gemini)');

        // Keep processing overlay active and automatically upscale
        handleUpscale(prediction.output);
      } else {
        // Poll for result (for Replicate fallback)
        let pollCount = 0;
        const maxPolls = 60; // 1 minute timeout
        
        const pollResult = async () => {
          try {
            const statusResponse = await fetch(`/api/predictions/${prediction.id}`);
            const status = await statusResponse.json();
            
            if (status.status === 'succeeded' && status.output) {
              console.log('✅ General edit processing completed');

              // Keep processing overlay active and automatically upscale
              handleUpscale(status.output);
            } else if (status.status === 'failed') {
              throw new Error('Processing failed');
            } else if (pollCount < maxPolls) {
              pollCount++;
              setTimeout(pollResult, 1000);
            } else {
              throw new Error('Processing timeout');
            }
          } catch (error) {
            console.error('Polling error:', error);
            throw error;
          }
        };
        
        pollResult();
      }
      
    } catch (error) {
      console.error('Processing error:', error);
      updateState({
        processError: 'Failed to process image. Please try again.',
        isProcessing: false
      });
    }
  }, [updateState, processingImageUrl, handleUpscale]);

  // Process retouch (click-to-edit) - now handles multiple hotspots with automatic upscaling
  const processRetouch = useCallback(async (hotspots) => {
    console.log('🎨 [AI_PROCESSING] processRetouch called with:', { 
      hotspots, 
      processingImageUrl: !!processingImageUrl,
      hotspotsLength: hotspots?.length || 0 
    });
    
    if (!processingImageUrl || !hotspots || hotspots.length === 0) {
      console.log('❌ [AI_PROCESSING] Early return - missing requirements:', { 
        processingImageUrl: !!processingImageUrl, 
        hotspots: !!hotspots, 
        hotspotsLength: hotspots?.length || 0 
      });
      return;
    }
    
    // Validate that all hotspots have meaningful prompts
    const validHotspots = hotspots.filter(hotspot => {
      const prompt = hotspot.prompt?.trim();
      return prompt && prompt.length > 2 && !/^[a-z]{1,3}$/i.test(prompt);
    });
    
    if (validHotspots.length === 0) {
      updateState({
        processError: 'Please enter meaningful editing instructions for your hotspots. Examples: "Add a chair", "Change wall color to blue", "Remove the fan"'
      });
      return;
    }
    
    console.log('🎨 Starting multi-point retouch processing:', validHotspots);
    updateState({
      isProcessing: true,
      processError: null
    });
    
    try {
      // Cap to 5 edits and build a concise instruction list (no references in general edit)
      const limitedHotspots = validHotspots.slice(0, 5);
      const combinedPrompt = limitedHotspots
        .map((hotspot, index) => `Edit ${index + 1}: At coordinates (${hotspot.x}%, ${hotspot.y}%) - ${hotspot.prompt}`)
        .join('\n');

      const optimizedPrompt = `Apply the following edits to the image. Address each item precisely at its coordinates and keep everything else unchanged:\n\n${combinedPrompt}\n\nRequirements:\n- Apply all listed edits, one pass, consistent quality\n- Do not change composition, camera, geometry, object placement, or dimensions\n- Maintain original resolution and overall realism; blend changes naturally`;

      // Log the Gemini prompt for debugging
      console.log('🤖 GEMINI PROMPT FOR RETOUCH:', {
        hotspots: limitedHotspots.map(h => ({ 
          id: h.id, 
          x: h.x, 
          y: h.y, 
          prompt: h.prompt,
        })),
        combinedPrompt,
        optimizedPrompt,
        imageUrl: processingImageUrl
      });
      
      // Phase 3: Enhanced prompt generation - send hotspots and image context
      const imageContext = {
        hasPeople: combinedPrompt.toLowerCase().includes('person') || combinedPrompt.toLowerCase().includes('face'),
        hasSky: combinedPrompt.toLowerCase().includes('sky') || combinedPrompt.toLowerCase().includes('cloud'),
        hasArchitecture: combinedPrompt.toLowerCase().includes('building') || combinedPrompt.toLowerCase().includes('wall'),
        hasLandscape: combinedPrompt.toLowerCase().includes('tree') || combinedPrompt.toLowerCase().includes('grass'),
        imageDimensions: containerDims ? { width: containerDims.width, height: containerDims.height } : null
      };

      console.log('🌐 [AI_PROCESSING] Making API call to /api/predictions/general-edit');
      const { apiPost } = await import('../../../lib/apiClient');
      const response = await apiPost('/api/predictions/general-edit', {
        image: processingImageUrl,
        prompt: optimizedPrompt,
        hotspots: limitedHotspots,
        imageContext: imageContext
      });
      
      console.log('🌐 [AI_PROCESSING] API response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to apply retouch';
        try {
          const errorData = await response.json();
          console.error('❌ [AI_PROCESSING] API error response:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          console.error('❌ [AI_PROCESSING] Failed to parse error response:', e);
          const errorText = await response.text();
          console.error('❌ [AI_PROCESSING] Raw error response:', errorText);
        }
        throw new Error(errorMessage);
      }
      
      const prediction = await response.json();
      console.log('⏳ Multi-point retouch processing started');
      
      // Check if this is a Gemini response (already completed)
      if (prediction.status === 'succeeded' && prediction.output) {
        console.log('✅ Multi-point retouch processing completed (Gemini)');
        
        // Mark upload as processed and count towards limit (only on first edit)
        if (uploadId) {
          console.log('📋 [GENERAL_EDIT] Marking upload as processed:', uploadId);
          await markUploadAsProcessed('general-edit', prediction.id);
          console.log('✅ [GENERAL_EDIT] Upload marked as processed successfully');
          // Refresh upload stats after successful processing
          refreshAfterUpload();
          // Dispatch global event to notify other components
          window.dispatchEvent(new CustomEvent('uploadProcessed'));
        } else {
          console.log('ℹ️ [GENERAL_EDIT] No uploadId available - this is likely a subsequent edit, skipping upload tracking');
        }
        
        // Show the edited image immediately and continue upscaling in background
        updateState({
          processedSrc: prediction.output,
          showEnhanced: true,
          isProcessing: false, // Hide processing overlay
          editHotspots: [],
          hotspotCounter: 1
        });
        
        // Phase 1: Complete session after processing
        if (onSessionComplete) {
          onSessionComplete(prediction.output);
        }
        
        // Continue upscaling in background
        handleUpscale(prediction.output);
      } else {
        // Poll for result (for Replicate fallback)
        let pollCount = 0;
        const maxPolls = 60;
        
        const pollResult = async () => {
          try {
            const statusResponse = await fetch(`/api/predictions/${prediction.id}`);
            const status = await statusResponse.json();
            
            if (status.status === 'succeeded' && status.output) {
              console.log('✅ Multi-point retouch processing completed');
              
              // Mark upload as processed and count towards limit
              if (uploadId) {
                console.log('📋 [GENERAL_EDIT] Marking upload as processed:', uploadId);
                await markUploadAsProcessed(status.id);
                console.log('✅ [GENERAL_EDIT] Upload marked as processed successfully');
                // Refresh upload stats after successful processing
                refreshAfterUpload();
                // Dispatch global event to notify other components
                window.dispatchEvent(new CustomEvent('uploadProcessed'));
              } else {
                console.log('ℹ️ [GENERAL_EDIT] No uploadId available - this is likely a subsequent edit, skipping upload tracking');
              }
              
              // Keep processing overlay active and automatically upscale
              handleUpscale(status.output);
              updateState({
                editHotspots: [],
                hotspotCounter: 1
              });
              
              // Phase 1: Complete session after processing
              if (onSessionComplete) {
                onSessionComplete(status.output);
              }
            } else if (status.status === 'failed') {
              throw new Error('Retouch processing failed');
            } else if (pollCount < maxPolls) {
              pollCount++;
              setTimeout(pollResult, 1000);
            } else {
              throw new Error('Retouch processing timeout');
            }
          } catch (error) {
            console.error('Retouch polling error:', error);
            throw error;
          }
        };
        
        pollResult();
      }
      
    } catch (error) {
      console.error('Retouch processing error:', error);
      updateState({
        processError: 'Failed to apply retouch. Please try again.',
        isProcessing: false
      });
    }
  }, [updateState, uploadId, markUploadAsProcessed, refreshAfterUpload, processingImageUrl, handleUpscale]);

  return {
    processImage,
    processRetouch,
    handleUpscale
  };
};