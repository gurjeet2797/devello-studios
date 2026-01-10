import Replicate from "replicate";
import { GoogleGenAI } from "@google/genai";
// sharp is server-only - will be dynamically imported when needed
import config from './config.js';
import { createLogger } from './logger.js';
import { apiCostTracker } from './apiCostTracker.js';
import { getImageDimensions, standardizeImageAspectRatio, cropAndStandardizeReference } from './imageStandardization.js';

const logger = createLogger('aiService');

// Initialize Replicate client
console.log('🔧 [AI_SERVICE] Initializing Replicate client...');
    // SECURITY: Removed token logging for security
    console.log('🔧 [AI_SERVICE] REPLICATE_API_TOKEN:', config.replicate.apiToken ? 'Set ✅' : 'Missing ❌');

const replicate = new Replicate({
  auth: config.replicate.apiToken,
});

// AI Tool Types
export const AI_TOOLS = {
  LIGHTING: 'lighting',
  UPSCALE: 'upscale',
  GENERAL_EDIT: 'general_edit',
  ASSISTED_EDIT: 'assisted_edit'
};

/* ------------------------------------------------------------------ */
/* 1.  Lighting style registry                                         */
/* ------------------------------------------------------------------ */
export const LIGHTING_VARIANTS = {
  /**
   * 5300 K, ≈35 ° sun height, volumetric rays
   * (late-morning dramatic daylight)
   */
  'Dramatic Daylight': {
    kelvin: 5300,
    sunElevation: 35,
    volumetric: true,
    description:
      'dramatic late-morning daylight (~5300 K) with crisp contrast and airy atmosphere',
  },

  /**
   * 5800 K, ≈65 ° sun height, standard sharp daylight
   * (mid-afternoon neutral sunlight)
   */
  'Midday Bright': {
    kelvin: 5800,
    sunElevation: 65,
    volumetric: false,
    description:
      'bright neutral midday sunlight (~5800 K) around 2 p.m. with clear shadows',
  },

  /**
   * 6500 K ambient, no direct sun, evening interior glow
   * (low natural light + artificial fixtures)
   */
  'Cozy Evening': {
    kelvin: 6500,
    sunElevation: null, // diffuse dusk
    volumetric: false,
    description:
      'soft evening ambience (~6500 K twilight) complemented by interior lamps and fixtures',
  },
};

/* ------------------------------------------------------------------ */
/* 2.  Dynamic lighting-prompt builder                                 */
/* ------------------------------------------------------------------ */
/**
 * Builds a high-fidelity relighting prompt for the
 * `black-forest-labs/flux-kontext-max` Replicate model.
 *
 * @param {'Dramatic Daylight' | 'Midday Bright' | 'Cozy Evening'} variant
 * @returns {string} fully-rendered prompt string
 */
export function buildLightingPrompt(
  variant = 'Dramatic Daylight',
) {
  const preset = LIGHTING_VARIANTS[variant];

  // Simplified, optimized prompt for Dramatic Daylight
  if (variant === 'Dramatic Daylight') {
    return [
      'Relight this photo with dramatic late-morning daylight.',
      'Add warm directional sunlight with natural lighting effects.',
      'Create realistic shadows and volumetric light rays.',
      'Do not add lens flares, light flares, or any artificial light effects.',
      'Maintain the original composition, colors, and scene elements.',
      'Do not add windows, walls, or architectural elements not present in the original.',
      'CRITICAL: Do not adjust or rotate the image orientation. Keep the original orientation intact.',
      'High quality, photorealistic result.'
    ].join(' ');
  }

  // Simplified, optimized prompt for Midday Bright
  if (variant === 'Midday Bright') {
    return [
      'Relight this photo with bright midday sunlight.',
      'Enhance the natural lighting without adding new objects or windows.',
      'Create crisp, bright lighting that preserves the original scene.',
      'Maintain the exact same composition, colors, and elements.',
      'Only adjust lighting - do not add windows, doors, or other objects.',
      'CRITICAL: Do not adjust or rotate the image orientation. Keep the original orientation intact.',
      'High quality, photorealistic result.'
    ].join(' ');
  }

  // Simplified, optimized prompt for Cozy Evening
  if (variant === 'Cozy Evening') {
    return [
      'Relight this interior photo with soft evening lighting.',
      'Add warm ambient lighting from existing fixtures.',
      'Create cozy atmosphere with soft glows.',
      'Maintain the original composition and colors.',
      'CRITICAL: Do not adjust or rotate the image orientation. Keep the original orientation intact.',
      'High quality, photorealistic result.'
    ].join(' ');
  }

  // Original complex prompt for other variants  
  const sunSentence =
    preset.sunElevation !== null
      ? [
          `Cast directional sunbeams through **every** window, door, skylight, or clerestory opening at ≈${preset.sunElevation}° solar elevation.`,
          'For each aperture, auto-size beam width and softness based on its dimensions and any diffusing materials (sheer curtains, blinds, frosted glass).',
          'Maintain a gentle 8–10 px penumbra where shadows fall.',
        ].join(' ')
      : [
          'Use low ambient twilight with no distinct exterior sunbeam.',
          'Automatically detect interior bulbs, sconces, and other fixtures; simulate warm glows and fall-off consistent with their positions.',
        ].join(' ');

  const volumetricLighting = preset.volumetric
    ? 'Add subtle volumetric light smoke that reveals ray-cones without overpowering the scene.'
    : '';

  return [
    `Relight the uploaded interior photograph to ${preset.description}.`,
    sunSentence,
    volumetricLighting,
    'Maintain the original camera angle, composition, geometry, object placement, colors, textures, micro-patterns, and active lamp glow exactly—no perspective shifts, no color deviations, no object edits.',
    'Balance exposure (avoid clipped highlights; ≤10 % mid-tone contrast boost) and preserve native film grain, noise, and lens characteristics.',
    'Return a **lossless PNG** at identical resolution.',
  ]
    .filter(Boolean)
    .join('\n');
}

/* ------------------------------------------------------------------ */
/* 3.  Prompt-template registry                                         */
/* ------------------------------------------------------------------ */
export const PROMPT_TEMPLATES = {
  [AI_TOOLS.LIGHTING]: Object.fromEntries(
    Object.keys(LIGHTING_VARIANTS).map((label) => [
      label,
      buildLightingPrompt(label),
    ]),
  ),


  [AI_TOOLS.GENERAL_EDIT]: {
    default: `Apply the user's custom prompt to enhance or modify this image. 

CRITICAL REQUIREMENTS:
- Maintain the EXACT same image dimensions and aspect ratio as the original
- Do NOT crop, resize, or change the composition of the original image
- Preserve the original composition, structure, and layout completely
- Keep all elements in their original positions and proportions
- The output must be identical in size and composition to the input image
- Only modify the specific areas requested, leave everything else unchanged

Maintain high quality and realistic results. Output a lossless PNG at original resolution with identical dimensions.`,
    removeSunflare: `Remove all lens flare, sun flare, and glare artifacts from this image while preserving the original lighting and atmosphere. Clean up any bright spots, streaks, or circular artifacts caused by direct light hitting the camera lens. Maintain the natural lighting conditions and color balance. Preserve all details and textures in the image. 

CRITICAL: Maintain the EXACT same image dimensions and aspect ratio as the original. Do NOT crop, resize, or change the composition. Output a clean, flare-free image at original resolution with identical dimensions.`
  },
};

// Utility Functions
const convertGoogleDriveUrl = (url) => {
  if (url.includes('drive.google.com')) {
    const fileId = url.match(/\/d\/(.*?)\/view/)?.[1];
    if (fileId) {
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }
  return url;
};

const validateImageUrl = async (url) => {
  try {
    const directUrl = convertGoogleDriveUrl(url);
    logger.info('Validating image URL', { url: directUrl });

    // Skip validation for production URLs
    if (directUrl.includes('supabase.co') || directUrl.includes('replicate.delivery')) {
      logger.info('Skipping validation for production URL', { url: directUrl });
      return directUrl;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(directUrl, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DevelloStudio/1.0)'
      }
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Image URL returned ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      throw new Error('URL does not point to an image');
    }
    
    return directUrl;
  } catch (error) {
    logger.error('Image URL validation failed', { url, error: error.message });
    if (error.name === 'AbortError') {
      throw new Error('Image validation timed out');
    }
    throw error;
  }
};

// Main AI Service Class
class AIService {
  constructor() {
    this.replicate = replicate;
    this.config = config;
    
    // Initialize Google Gemini if API key is available
    if (config.google?.apiKey) {
      this.gemini = new GoogleGenAI({ apiKey: config.google.apiKey });
      console.log('🔧 [AI_SERVICE] Google Gemini initialized');
    } else {
      console.log('⚠️ [AI_SERVICE] Google Gemini API key not found, using Replicate only');
    }
  }

  async createPrediction(toolType, options = {}) {
    const { image, prompt, customPrompt, ...otherOptions } = options;

    if (!image) {
      throw new Error('No input image provided');
    }

    // Validate and process image URL
    let finalImageUrl = image.startsWith("http") ? image : `data:image/jpeg;base64,${image}`;
    
    if (finalImageUrl.startsWith("http")) {
      finalImageUrl = await validateImageUrl(finalImageUrl);
    }

    // Get the appropriate prompt
    const finalPrompt = customPrompt || this.getPrompt(toolType, prompt);
    
    logger.info('Creating prediction', { 
      toolType, 
      imageType: finalImageUrl.startsWith("http") ? "URL" : "base64",
      promptLength: finalPrompt.length 
    });

    // Create prediction with retry logic
    let prediction;
    let attempts = 0;

    // Use Flux Kontext Max model for all tools (lighting, cleanup, and general edit)
    console.log('🚀 [AI_SERVICE] Creating Replicate prediction with Flux Kontext Max...');
    console.log('🚀 [AI_SERVICE] Model: black-forest-labs/flux-kontext-max');
    console.log('🚀 [AI_SERVICE] Version: b94039e52f5065899a5f50cc69186801e28d63c74b0a3dafc22ea93bbdf4c36c');
    console.log('🚀 [AI_SERVICE] Auth token present:', !!this.replicate.auth);
    // SECURITY: Removed token preview logging for security

    while (attempts < config.replicate.maxRetries) {
      try {
        console.log('🔄 [AI_SERVICE] Attempt', attempts + 1, 'of', config.replicate.maxRetries);
        prediction = await this.replicate.predictions.create({
          version: "b94039e52f5065899a5f50cc69186801e28d63c74b0a3dafc22ea93bbdf4c36c",
          input: {
            prompt: finalPrompt,
            input_image: finalImageUrl,
            aspect_ratio: "match_input_image",
            output_format: "png",
            safety_tolerance: 2,
            ...otherOptions
          }
        });
        break;
      } catch (createError) {
        attempts++;
        logger.warn('Prediction creation attempt failed', { 
          attempt: attempts, 
          error: createError.message 
        });
        
        if (attempts >= config.replicate.maxRetries) {
          throw createError;
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, 1000 * Math.pow(2, attempts - 1))
        );
      }
    }

    logger.info('Prediction created successfully', { 
      id: prediction.id, 
      status: prediction.status 
    });

    return prediction;
  }

  async getPrediction(id) {
    try {
      const prediction = await this.replicate.predictions.get(id);
      
      // Track cost when prediction is completed
      if (prediction.status === 'succeeded' && prediction.metrics?.predict_time) {
        const model = 'black-forest-labs/flux-kontext-max';
        const duration = prediction.metrics.predict_time;
        
        await apiCostTracker.trackReplicateCost(
          prediction.id,
          model,
          duration,
          prediction.status,
          {
            endpoint: 'aiService.getPrediction',
            prompt: prediction.input?.prompt?.substring(0, 100),
            outputFormat: prediction.input?.output_format
          }
        );
      }
      
      return prediction;
    } catch (error) {
      logger.error('Failed to get prediction', { id, error: error.message });
      throw error;
    }
  }

  async upscaleImage(imageUrl, scale = 2, options = {}) {
    try {
      const { preserveAspectRatio, preserveOrientation, originalDimensions } = options;
      logger.info('Starting image upscale', { imageUrl, scale, preserveAspectRatio, preserveOrientation, originalDimensions });
      
      // Validate and process image URL
      let finalImageUrl = imageUrl.startsWith("http") ? imageUrl : `data:image/jpeg;base64,${imageUrl}`;
      
      if (finalImageUrl.startsWith("http")) {
        finalImageUrl = await validateImageUrl(finalImageUrl);
      }
      
      // Prepare input parameters
      const inputParams = {
        image: finalImageUrl,
        scale: scale
      };
      
      // Add aspect ratio preservation if requested
      if (preserveAspectRatio && originalDimensions) {
        console.log('📏 [UPSCALE] Preserving aspect ratio:', originalDimensions);
        // Note: The Replicate model might not support custom parameters for aspect ratio
        // We'll log this for now and implement post-processing if needed
        inputParams.originalAspectRatio = originalDimensions.aspectRatio;
        inputParams.originalWidth = originalDimensions.width;
        inputParams.originalHeight = originalDimensions.height;
      }
      
      // Add orientation preservation if requested
      if (preserveOrientation && originalDimensions) {
        console.log('🔄 [UPSCALE] Preserving orientation:', originalDimensions);
        inputParams.preserveOrientation = true;
        inputParams.originalOrientation = originalDimensions.originalOrientation || 'preserve';
        inputParams.isPortrait = originalDimensions.isPortrait;
      }
      
      // Add retry logic for upscale API calls
      let retryCount = 0;
      const maxRetries = 3;
      let lastError;
      
      while (retryCount < maxRetries) {
        try {
          const prediction = await this.replicate.run(
            config.replicate.models.upscale,
            {
              input: inputParams
            }
          );

          const output = Array.isArray(prediction) ? prediction[0] : prediction;
          logger.info('Image upscale completed', { output, scale });
          
          // Post-process to ensure aspect ratio preservation if requested
          if (preserveAspectRatio && originalDimensions) {
            const correctedOutput = await this.preserveAspectRatio(output, originalDimensions, scale);
            return { output: correctedOutput };
          }
          
          // Post-process to ensure orientation preservation if requested
          if (preserveOrientation && originalDimensions) {
            const orientationCorrectedOutput = await this.preserveOrientation(output, originalDimensions);
            return { output: orientationCorrectedOutput };
          }
          
          return { output };
        } catch (error) {
          lastError = error;
          retryCount++;
          
          // Check if it's a rate limit error
          if (error.message?.includes('429') || error.message?.includes('rate limit')) {
            if (retryCount < maxRetries) {
              const delay = Math.min(retryCount * 2000, 10000); // 2s, 4s, 6s delays
              logger.warn(`Rate limited, retrying in ${delay/1000}s (attempt ${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          
          // For non-rate-limit errors, throw immediately
          throw error;
        }
      }
      
      // If we've exhausted retries, throw the last error
      throw lastError;
      
    } catch (error) {
      logger.error('Image upscale failed', { imageUrl, scale, error: error.message });
      throw error;
    }
  }

  // Post-process upscaled image to preserve original aspect ratio
  async preserveOrientation(upscaledImageUrl, originalDimensions) {
    try {
      console.log('🔄 [ORIENTATION] Post-processing upscaled image to preserve orientation');
      console.log('🔄 [ORIENTATION] Original dimensions:', originalDimensions);
      
      // Load the upscaled image
      const upscaledImg = new Image();
      upscaledImg.crossOrigin = 'anonymous';
      
      const upscaledDimensions = await new Promise((resolve, reject) => {
        upscaledImg.onload = () => {
          resolve({
            width: upscaledImg.naturalWidth,
            height: upscaledImg.naturalHeight,
            aspectRatio: upscaledImg.naturalWidth / upscaledImg.naturalHeight
          });
        };
        upscaledImg.onerror = () => reject(new Error('Failed to load upscaled image'));
        upscaledImg.src = upscaledImageUrl;
      });
      
      console.log('🔄 [ORIENTATION] Upscaled dimensions:', upscaledDimensions);
      
      // Check if orientation matches
      const originalIsPortrait = originalDimensions.isPortrait;
      const upscaledIsPortrait = upscaledDimensions.height > upscaledDimensions.width;
      
      if (originalIsPortrait === upscaledIsPortrait) {
        console.log('✅ [ORIENTATION] Orientation matches, no correction needed');
        return upscaledImageUrl;
      }
      
      console.log('⚠️ [ORIENTATION] Orientation mismatch detected, correcting...');
      console.log('🔄 [ORIENTATION] Original is portrait:', originalIsPortrait);
      console.log('🔄 [ORIENTATION] Upscaled is portrait:', upscaledIsPortrait);
      
      // Create canvas to rotate the upscaled image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions (swap for rotation)
      canvas.width = upscaledDimensions.height;
      canvas.height = upscaledDimensions.width;
      
      // Apply 90-degree rotation
      ctx.translate(upscaledDimensions.height, 0);
      ctx.rotate(Math.PI / 2);
      
      // Draw the image
      ctx.drawImage(upscaledImg, 0, 0);
      
      // Convert back to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const correctedUrl = URL.createObjectURL(blob);
            console.log('✅ [ORIENTATION] Orientation correction applied successfully');
            resolve(correctedUrl);
          } else {
            reject(new Error('Failed to create orientation-corrected image'));
          }
        }, 'image/jpeg', 0.95);
      });
    } catch (error) {
      console.error('❌ [ORIENTATION] Orientation preservation failed:', error);
      return upscaledImageUrl; // Return original if correction fails
    }
  }

  async preserveAspectRatio(upscaledImageUrl, originalDimensions, scale) {
    try {
      console.log('📏 [ASPECT_RATIO] Post-processing upscaled image to preserve aspect ratio');
      console.log('📏 [ASPECT_RATIO] Original standardized image:', originalDimensions);
      
      // Load the upscaled image
      const upscaledImg = new Image();
      upscaledImg.crossOrigin = 'anonymous';
      
      const upscaledDimensions = await new Promise((resolve, reject) => {
        upscaledImg.onload = () => {
          resolve({
            width: upscaledImg.naturalWidth,
            height: upscaledImg.naturalHeight,
            aspectRatio: upscaledImg.naturalWidth / upscaledImg.naturalHeight
          });
        };
        upscaledImg.onerror = () => reject(new Error('Failed to load upscaled image'));
        upscaledImg.src = upscaledImageUrl;
      });
      
      console.log('📏 [ASPECT_RATIO] Upscaled image:', upscaledDimensions);
      
      // Check if aspect ratios match (within tolerance)
      const aspectRatioDiff = Math.abs(upscaledDimensions.aspectRatio - originalDimensions.aspectRatio);
      const tolerance = 0.01; // 1% tolerance
      
      if (aspectRatioDiff <= tolerance) {
        console.log('✅ [ASPECT_RATIO] Aspect ratios match, no correction needed');
        return upscaledImageUrl;
      }
      
      console.log('⚠️ [ASPECT_RATIO] Aspect ratio mismatch detected, correcting...');
      console.log('📏 [ASPECT_RATIO] Target aspect ratio:', originalDimensions.aspectRatio);
      console.log('📏 [ASPECT_RATIO] Upscaled aspect ratio:', upscaledDimensions.aspectRatio);
      
      // Calculate target dimensions that preserve original standardized image aspect ratio
      const targetWidth = originalDimensions.width * scale;
      const targetHeight = originalDimensions.height * scale;
      
      // Create canvas to crop/resize the upscaled image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Calculate crop area to maintain aspect ratio
      const scaleX = upscaledDimensions.width / targetWidth;
      const scaleY = upscaledDimensions.height / targetHeight;
      const scaleToUse = Math.min(scaleX, scaleY);
      
      const sourceWidth = targetWidth * scaleToUse;
      const sourceHeight = targetHeight * scaleToUse;
      const sourceX = (upscaledDimensions.width - sourceWidth) / 2;
      const sourceY = (upscaledDimensions.height - sourceHeight) / 2;
      
      // Draw the cropped and resized image
      ctx.drawImage(
        upscaledImg,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, targetWidth, targetHeight
      );
      
      // Convert to blob and create URL
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const correctedUrl = URL.createObjectURL(blob);
            console.log('✅ [ASPECT_RATIO] Corrected image created:', correctedUrl);
            resolve(correctedUrl);
          } else {
            reject(new Error('Failed to create corrected image blob'));
          }
        }, 'image/jpeg', 0.95);
      });
      
    } catch (error) {
      console.error('❌ [ASPECT_RATIO] Failed to preserve aspect ratio:', error);
      // Return original upscaled image if correction fails
      return upscaledImageUrl;
    }
  }

  /**
   * Generic prompt resolver.
   */
  getPrompt(toolType, variant) {
    const templates = PROMPT_TEMPLATES[toolType];
    if (!templates) throw new Error(`Unknown tool type: ${toolType}`);

    // Lighting prompts are generated dynamically above, so the stored value is
    // already the finished prompt string.
    if (variant && templates[variant]) return templates[variant];

    // Fallback to first available template
    const [firstKey] = Object.keys(templates);
    return templates[firstKey];
  }

  /**
   * Convert a File object or URL to a Gemini API Part
   */
  async fileToGeminiPart(file) {
    try {
      // If it's already a URL (http/https), fetch and convert to base64
      if (typeof file === 'string' && (file.startsWith('http://') || file.startsWith('https://'))) {
        const response = await fetch(file);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        return { inlineData: { mimeType: contentType, data: base64 } };
      }
      
      // If it's a blob URL, we need to fetch it differently
      if (typeof file === 'string' && file.startsWith('blob:')) {
        // Blob URLs can't be fetched server-side, need to handle client-side
        throw new Error("Blob URLs cannot be processed server-side. Please convert to data URL or upload URL first.");
      }
      
      // If it's a File object, convert to base64
      if (file instanceof File || file.buffer) {
        let buffer;
        if (file.buffer) {
          buffer = Buffer.from(file.buffer);
        } else {
          const arrayBuffer = await file.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
        }
        const base64 = buffer.toString('base64');
        const mimeType = file.type || 'image/jpeg';
        return { inlineData: { mimeType, data: base64 } };
      }
      
      // If it's already a data URL
      if (typeof file === 'string' && file.startsWith('data:')) {
        const arr = file.split(',');
        if (arr.length < 2) throw new Error("Invalid data URL");
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
        
        const mimeType = mimeMatch[1];
        const data = arr[1];
        return { inlineData: { mimeType, data } };
      }
      
      throw new Error(`Unsupported file format: ${typeof file}`);
    } catch (error) {
      console.error('Error converting file to Gemini part:', error);
      console.error('File type:', typeof file);
      console.error('File value:', typeof file === 'string' ? file.substring(0, 100) : file);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  /**
   * Remove watermark from bottom right corner of image
   * @param {string} imageDataUrl - Base64 data URL of the image
   * @param {number} cropWidth - Width to crop from right (default: 120px)
   * @param {number} cropHeight - Height to crop from bottom (default: 80px)
   * @returns {Promise<string>} - New image data URL without watermark
   */
  async removeWatermark(imageDataUrl, cropWidth = 120, cropHeight = 80) {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas size to original image minus watermark area
          canvas.width = img.width - cropWidth;
          canvas.height = img.height - cropHeight;
          
          // Draw the image, cropping out the bottom right corner
          ctx.drawImage(
            img,
            0, 0, // Source x, y
            canvas.width, canvas.height, // Source width, height
            0, 0, // Destination x, y
            canvas.width, canvas.height // Destination width, height
          );
          
          // Convert back to data URL
          const mimeType = imageDataUrl.match(/data:([^;]+);/)?.[1] || 'image/png';
          const newDataUrl = canvas.toDataURL(mimeType);
          resolve(newDataUrl);
        };
        
        img.onerror = (error) => {
          console.error('Error loading image for watermark removal:', error);
          reject(new Error('Failed to load image for watermark removal'));
        };
        
        img.src = imageDataUrl;
      } catch (error) {
        console.error('Error removing watermark:', error);
        reject(error);
      }
    });
  }

  /**
   * Remove watermark from bottom right corner of image (Node.js version)
   * @param {string} imageDataUrl - Base64 data URL of the image
   * @param {number} cropWidth - Width to crop from right (default: 120px)
   * @param {number} cropHeight - Height to crop from bottom (default: 80px)
   * @returns {Promise<string>} - New image data URL without watermark
   */
  async removeWatermarkNode(imageDataUrl, cropWidth = 120, cropHeight = 80) {
    try {
      // Only run on server-side Node.js runtime (not Edge Runtime, not browser)
      if (typeof window !== 'undefined' || typeof EdgeRuntime !== 'undefined') {
        console.warn('removeWatermarkNode called in unsupported environment, returning original image');
        return imageDataUrl;
      }
      
      // Check if we're in Node.js runtime (sharp requires Node.js, not Edge Runtime)
      if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
        console.warn('Not in Node.js runtime, returning original image');
        return imageDataUrl;
      }
      
      // Dynamically import sharp only in Node.js runtime
      // Use a string-based approach that webpack can't statically analyze
      let sharp = null;
      try {
        // Use dynamic import with a variable to prevent static analysis
        const sharpModuleName = 'sharp';
        const sharpModule = await import(sharpModuleName);
        sharp = sharpModule.default || sharpModule;
      } catch (e) {
        console.warn('Sharp not available:', e.message);
        return imageDataUrl;
      }
      
      if (!sharp) {
        console.warn('Sharp not available, returning original image');
        return imageDataUrl;
      }
      
      // Parse data URL
      const base64Data = imageDataUrl.split(',')[1];
      const mimeMatch = imageDataUrl.match(/data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      
      // Use sharp for server-side image processing
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      const width = metadata.width;
      const height = metadata.height;
      
      // Crop out bottom right corner
      const croppedBuffer = await sharp(imageBuffer)
        .extract({
          left: 0,
          top: 0,
          width: Math.max(1, width - cropWidth),
          height: Math.max(1, height - cropHeight)
        })
        .toBuffer();
      
      // Convert back to base64 data URL
      const croppedBase64 = croppedBuffer.toString('base64');
      return `data:${mimeType};base64,${croppedBase64}`;
    } catch (error) {
      console.error('Error removing watermark (Node.js):', error);
      // If sharp is not available or fails, return original image
      return imageDataUrl;
    }
  }

  /**
   * Handle Gemini API response
   */
  async handleGeminiResponse(response, context) {
    // Handle nested response structure (response.response) or direct response
    const actualResponse = response.response || response;
    
    // Check for prompt blocking first
    if (actualResponse.promptFeedback?.blockReason) {
      const { blockReason, blockReasonMessage } = actualResponse.promptFeedback;
      const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
      console.error(errorMessage, { response, actualResponse });
      throw new Error(errorMessage);
    }

    // Try to find the image part - use correct response structure
    const imagePartFromResponse = actualResponse.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
      const { mimeType, data } = imagePartFromResponse.inlineData;
      console.log(`✅ [AI_SERVICE] Received image data (${mimeType}) for ${context}`);
      let imageDataUrl = `data:${mimeType};base64,${data}`;
      
      // Remove watermark for lighting tool images
      if (context === AI_TOOLS.LIGHTING) {
        try {
          console.log('🔧 [AI_SERVICE] Removing watermark from lighting tool image...');
          imageDataUrl = await this.removeWatermarkNode(imageDataUrl);
          console.log('✅ [AI_SERVICE] Watermark removed successfully');
        } catch (error) {
          console.warn('⚠️ [AI_SERVICE] Failed to remove watermark, using original image:', error.message);
          // Continue with original image if watermark removal fails
        }
      }
      
      return imageDataUrl;
    }

    // Enhanced error logging for debugging
    console.error(`❌ [AI_SERVICE] No image found in response for ${context}`, {
      hasCandidates: !!actualResponse.candidates,
      candidatesLength: actualResponse.candidates?.length,
      firstCandidate: actualResponse.candidates?.[0] ? {
        hasContent: !!actualResponse.candidates[0].content,
        hasParts: !!actualResponse.candidates[0].content?.parts,
        partsLength: actualResponse.candidates[0].content?.parts?.length,
        partsTypes: actualResponse.candidates[0].content?.parts?.map(p => Object.keys(p))
      } : null,
      finishReason: actualResponse.candidates?.[0]?.finishReason
    });

    // If no image, check for other reasons
    const finishReason = actualResponse.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
      console.error(errorMessage, { response, actualResponse });
      throw new Error(errorMessage);
    }
    
    // Try to extract text feedback from response
    const textParts = actualResponse.candidates?.[0]?.content?.parts?.filter(part => part.text);
    const textFeedback = textParts?.length > 0 ? textParts.map(p => p.text).join(' ').trim() : actualResponse.text?.trim();
    
    const errorMessage = `The AI model did not return an image for the ${context}. ` + 
      (textFeedback 
        ? `The model responded with text: "${textFeedback.substring(0, 200)}"`
        : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");

    console.error(`Model response did not contain an image part for ${context}.`, { response, actualResponse });
    throw new Error(errorMessage);
  }

  /**
   * Create prediction using Google Gemini 2.5 Flash
   */
  async createGeminiPrediction(toolType, options = {}) {
    if (!this.gemini) {
      console.error('❌ [AI_SERVICE] Google Gemini not initialized');
      console.error('❌ [AI_SERVICE] GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Set' : 'Missing');
      console.error('❌ [AI_SERVICE] Config google.apiKey:', config.google?.apiKey ? 'Set' : 'Missing');
      throw new Error('GOOGLE_API_KEY not found - Gemini features will be disabled');
    }
    

    const { image, prompt, customPrompt, allHotspots, hotspots, ...otherOptions } = options;

    if (!image) {
      throw new Error('No input image provided');
    }

    // Get the appropriate prompt
    let finalPrompt = customPrompt || this.getPrompt(toolType, prompt);
    
    // Handle GENERAL_EDIT with hotspots (similar to user's example)
    if (toolType === AI_TOOLS.GENERAL_EDIT) {
      const editHotspots = hotspots || allHotspots || [];
      if (editHotspots.length > 0) {
        // Use the first hotspot for focused editing (or combine multiple)
        const primaryHotspot = editHotspots[0];
        const userPrompt = customPrompt || prompt || '';
        
        finalPrompt = `CRITICAL OUTPUT REQUIREMENT: You must output an image with the EXACT same dimensions, aspect ratio, and composition as the FIRST (original) image provided. DO NOT crop, resize, or change the composition. Output the FULL original image with edits applied.

You are an expert photo editor AI. Your task is to perform natural, localized edits on the FULL original image based on the user's request.

User Request: "${userPrompt}"

Edit Locations: Apply the requested edits at coordinates (${primaryHotspot.x}%, ${primaryHotspot.y}%)${editHotspots.length > 1 ? ` and ${editHotspots.length - 1} other location(s)` : ''}. 
IMPORTANT: These coordinates indicate WHERE to apply edits in the original image. They are NOT crop boundaries. You must preserve and output the ENTIRE original image.

Editing Guidelines:
- Apply edits only at the specified coordinates while keeping the rest of the image unchanged.
- The edits must be realistic and blend seamlessly with the surrounding area.
- Maintain the EXACT same image dimensions and aspect ratio as the original.
- Do NOT crop, resize, or change the composition of the original image.
- Preserve the original composition, structure, and layout completely.
- Output the FULL image with all edits applied, not a cropped version.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final edited image. Do not return text.`;
        
        // Add reference image context for GENERAL_EDIT if hotspots have reference images
        const hotspotsWithRefs = editHotspots.filter(h => h.referenceImages && h.referenceImages.length > 0);
        if (hotspotsWithRefs.length > 0) {
          const referenceInfo = hotspotsWithRefs.map(h => {
            let info = `Hotspot ${h.id} at (${h.x}%, ${h.y}%): "${h.prompt || ''}"`;
            
            // Separate reference images with focus points from full images
            const refsWithFocus = h.referenceImages.filter(ref => ref.selectionPoint);
            const refsFull = h.referenceImages.filter(ref => !ref.selectionPoint);
            
            if (refsWithFocus.length > 0) {
              refsWithFocus.forEach(ref => {
                info += `\n  - Reference image with FOCUSED selection at (${ref.selectionPoint.x}%, ${ref.selectionPoint.y}%): Use ONLY this focused area of the reference image for style guidance`;
              });
            }
            if (refsFull.length > 0) {
              info += `\n  - Reference image(s) (full image): Use the entire reference image for style guidance`;
            }
            
            return info;
          }).join('\n');

          finalPrompt += `\n\nReference Images:
${referenceInfo}

Use reference images for style guidance only. Apply the style at the specified hotspot coordinates. Output must match the first image's dimensions exactly.`;
        }
      } else {
        // No hotspots, use standard prompt with safety guidelines
        finalPrompt = `${finalPrompt}

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final edited image. Do not return text.`;
      }
    }
    
    // Only assisted edit uses reference images
    if (toolType === AI_TOOLS.ASSISTED_EDIT && allHotspots && allHotspots.length > 0) {
      const hotspotsWithRefs = allHotspots.filter(h => h.referenceImages && h.referenceImages.length > 0);
      if (hotspotsWithRefs.length > 0) {
        const referenceInfo = hotspotsWithRefs.map(h => {
          let info = `Hotspot ${h.id} (${h.x}%, ${h.y}%): "${h.prompt || ''}" - Reference images provided`;
          const refsWithSelection = h.referenceImages.filter(ref => ref.selectionPoint);
          if (refsWithSelection.length > 0) {
            const selectionInfo = refsWithSelection.map(ref => 
              `Focus point at (${ref.selectionPoint.x}%, ${ref.selectionPoint.y}%)`
            ).join(', ');
            info += `\n  Focus areas: ${selectionInfo}`;
          }
          return info;
        }).join('\n');

        finalPrompt += `\n\nReference Images Context:\n${referenceInfo}\n\nCRITICAL REQUIREMENTS FOR REFERENCE IMAGES:
- Maintain the EXACT same image dimensions and aspect ratio as the original
- Do NOT crop, resize, or change the composition of the original image
- Apply only the style/elements from the reference images to the specified areas
- Keep the original image structure, layout, and proportions completely intact
- The output must be identical in size and composition to the input image
- Use the reference images ONLY for style guidance, not for changing the image structure

Use the reference images to guide the editing style and approach for the specified hotspots. Pay special attention to the focus areas indicated by selection points, but preserve the original image dimensions and composition.`;
      }
    }
    
    logger.info('Creating Gemini prediction', { 
      toolType, 
      promptLength: finalPrompt.length,
      hasReferenceImages: (toolType === AI_TOOLS.ASSISTED_EDIT || toolType === AI_TOOLS.GENERAL_EDIT) && !!((hotspots || allHotspots) && (hotspots || allHotspots).some(h => h.referenceImages && h.referenceImages.length > 0))
    });

    try {
      // Convert main image to Gemini format
      console.log('🖼️ [AI_SERVICE] Converting image to Gemini format...');
      console.log('🖼️ [AI_SERVICE] Image type:', typeof image);
      console.log('🖼️ [AI_SERVICE] Image value (first 100 chars):', typeof image === 'string' ? image.substring(0, 100) : image);
      
      // Helper function to convert Buffer to data URL
      const bufferToDataUrl = (buffer, mimeType = 'image/jpeg') => {
        const base64 = buffer.toString('base64');
        return `data:${mimeType};base64,${base64}`;
      };
      
      // Standardize images for GENERAL_EDIT and ASSISTED_EDIT tools
      let standardizedImage = image;
      let targetAspectRatio = null;
      
      if (toolType === AI_TOOLS.GENERAL_EDIT || toolType === AI_TOOLS.ASSISTED_EDIT) {
        try {
          // Get original image aspect ratio
          const originalDims = await getImageDimensions(image);
          targetAspectRatio = originalDims.aspectRatio;
          console.log('📐 [AI_SERVICE] Original image aspect ratio:', targetAspectRatio.toFixed(3));
          
          // Standardize original image
          const standardizedBuffer = await standardizeImageAspectRatio(image, targetAspectRatio);
          standardizedImage = bufferToDataUrl(standardizedBuffer, 'image/jpeg');
          console.log('✅ [AI_SERVICE] Original image standardized');
        } catch (error) {
          console.warn('⚠️ [AI_SERVICE] Failed to standardize original image, using original:', error.message);
          // Continue with original image if standardization fails
        }
      }
      
      let imagePart;
      try {
        imagePart = await this.fileToGeminiPart(standardizedImage);
        console.log('✅ [AI_SERVICE] Image converted successfully');
        console.log('✅ [AI_SERVICE] Image part structure:', {
          hasInlineData: !!imagePart?.inlineData,
          mimeType: imagePart?.inlineData?.mimeType,
          dataLength: imagePart?.inlineData?.data?.length
        });
      } catch (imageError) {
        console.error('❌ [AI_SERVICE] Failed to convert image:', {
          message: imageError.message,
          stack: imageError.stack,
          imageType: typeof image,
          imageValue: typeof image === 'string' ? image.substring(0, 100) : image
        });
        throw new Error(`Failed to convert image: ${imageError.message}`);
      }
      
      const parts = [imagePart];
      
      // Attach reference images for assisted edit and general edit
      const hotspotsToProcess = toolType === AI_TOOLS.ASSISTED_EDIT ? allHotspots : (hotspots || allHotspots);
      if ((toolType === AI_TOOLS.ASSISTED_EDIT || toolType === AI_TOOLS.GENERAL_EDIT) && hotspotsToProcess && hotspotsToProcess.length > 0 && targetAspectRatio) {
        for (const hotspot of hotspotsToProcess) {
          if (hotspot.referenceImages && hotspot.referenceImages.length > 0) {
            for (const refImage of hotspot.referenceImages) {
              try {
                let standardizedRefBuffer;
                
                if (refImage.selectionPoint) {
                  // Crop focused area and standardize
                  console.log(`✂️ [AI_SERVICE] Cropping and standardizing reference image with focus point for hotspot ${hotspot.id}`);
                  standardizedRefBuffer = await cropAndStandardizeReference(
                    refImage.url || refImage,
                    refImage.selectionPoint,
                    targetAspectRatio
                  );
                } else {
                  // Just standardize full image
                  console.log(`📐 [AI_SERVICE] Standardizing full reference image for hotspot ${hotspot.id}`);
                  standardizedRefBuffer = await standardizeImageAspectRatio(
                    refImage.url || refImage,
                    targetAspectRatio
                  );
                }
                
                const standardizedRefDataUrl = bufferToDataUrl(standardizedRefBuffer, 'image/jpeg');
                const refImagePart = await this.fileToGeminiPart(standardizedRefDataUrl);
                parts.push(refImagePart);
                
                const selectionInfo = refImage.selectionPoint 
                  ? ` with focus point at (${refImage.selectionPoint.x}%, ${refImage.selectionPoint.y}%)`
                  : '';
                const toolLabel = toolType === AI_TOOLS.ASSISTED_EDIT ? 'assisted' : 'general';
                console.log(`📎 [AI_SERVICE] Added ${toolLabel} reference for hotspot ${hotspot.id}${selectionInfo} (standardized to aspect ratio ${targetAspectRatio.toFixed(3)})`);
              } catch (error) {
                console.error(`❌ [AI_SERVICE] Failed to add reference image for hotspot ${hotspot.id}:`, error);
              }
            }
          }
        }
      }
      
      const textPart = { text: finalPrompt };
      parts.push(textPart);

      console.log('🚀 [AI_SERVICE] Creating Gemini prediction...');
      console.log(`🚀 [AI_SERVICE] Total parts: ${parts.length} (1 main image + ${parts.length - 2} reference images + 1 text)`);
      
      // Use gemini-2.5-flash-image for image generation (Nano Banana)
      // For GENERAL_EDIT tool, use image generation model; for other tools, use appropriate model
      let modelName;
      if (toolType === AI_TOOLS.GENERAL_EDIT) {
        // Use environment variable override or default to gemini-2.5-flash-image
        modelName = process.env.GEMINI_GENERAL_EDIT_MODEL || 'gemini-2.5-flash-image';
      } else {
        // For other tools, use standard model
        modelName = 'gemini-1.5-pro';
      }
      let response;
      
      try {
        console.log('🚀 [AI_SERVICE] Using model:', modelName);
        response = await this.gemini.models.generateContent({
          model: modelName,
          contents: { parts },
        });
      } catch (modelError) {
        // If model fails, try gemini-1.5-pro as fallback
        if (modelError.message?.includes('not found') || modelError.message?.includes('404') || modelError.message?.includes('model')) {
          console.log('⚠️ [AI_SERVICE] Image generation model failed, trying standard model...');
          try {
            const fallbackModel = 'gemini-1.5-pro';
            modelName = fallbackModel;
            response = await this.gemini.models.generateContent({
              model: fallbackModel,
              contents: { parts },
            });
            console.log(`✅ [AI_SERVICE] Using fallback model: ${fallbackModel}`);
          } catch (fallbackError) {
            console.error('❌ [AI_SERVICE] Both models failed:', {
              primary: modelError.message,
              fallback: fallbackError.message
            });
            throw new Error(`Gemini model error: ${modelError.message}. Please check that the model name is correct and you have access to image generation models.`);
          }
        } else {
          throw modelError;
        }
      }

      console.log('✅ [AI_SERVICE] Gemini prediction completed');

      // Track API costs
      if (response.response?.usageMetadata) {
        const { promptTokenCount, candidatesTokenCount } = response.response.usageMetadata;
        if (promptTokenCount && candidatesTokenCount) {
          await apiCostTracker.trackGeminiCost(
            promptTokenCount,
            candidatesTokenCount,
            modelName,
            {
              toolType,
              endpoint: 'aiService.createGeminiPrediction',
              promptLength: finalPrompt.length,
              imageCount: parts.filter(p => p.inlineData).length
            }
          );
        }
      }

      const imageDataUrl = await this.handleGeminiResponse(response, toolType);
      
      // Convert data URL to File object for consistency
      const dataUrlToFile = (dataUrl, filename) => {
        const arr = dataUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch[1];
        const bstr = Buffer.from(arr[1], 'base64');
        return new File([bstr], filename, {type: mime});
      };

      const resultFile = dataUrlToFile(imageDataUrl, `gemini-${toolType}-${Date.now()}.png`);

      // Return in Replicate-compatible format
      return {
        id: `gemini-${Date.now()}`,
        status: 'succeeded',
        output: imageDataUrl,
        file: resultFile
      };

    } catch (error) {
      logger.error('Gemini prediction failed', { 
        toolType, 
        error: error.message,
        stack: error.stack,
        name: error.name,
        response: error.response?.data || error.response || 'No response data'
      });
      console.error('❌ [AI_SERVICE] Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause,
        response: error.response?.data || error.response
      });
      throw error;
    }
  }


}

// Export singleton instance
const aiService = new AIService();
export default aiService;
export { AIService }; 