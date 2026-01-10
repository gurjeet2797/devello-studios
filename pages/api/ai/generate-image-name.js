import { GoogleGenerativeAI } from '@google/generative-ai';
import { withMiddleware } from '../../../lib/middleware.js';
import { createLogger } from '../../../lib/logger.js';

const logger = createLogger('generate-image-name');

// Initialize Gemini lazily
let genAI = null;
const getGemini = () => {
  if (!genAI) {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not configured');
    }
    try {
      genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    } catch (initError) {
      console.error('❌ [GENERATE_IMAGE_NAME] Failed to initialize Gemini:', initError);
      throw initError;
    }
  }
  return genAI;
};

const handler = async (req, res) => {
  const timer = logger.startTimer('generate-image-name');
  
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { imageUrl, prompt, changeDescription } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'No image URL provided' });
    }

    // Validate API key
    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({
        error: 'Failed to generate image name',
        message: 'API configuration error'
      });
    }

    logger.info('Generating image name', { imageUrl: imageUrl.substring(0, 100) });

    const genAIInstance = getGemini();
    const model = genAIInstance.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Fetch image and convert to base64
    let imageBuffer;
    let mimeType = 'image/jpeg';
    
    if (imageUrl.startsWith('data:')) {
      // Handle data URL
      const base64Data = imageUrl.split(',')[1];
      const mimeMatch = imageUrl.match(/data:([^;]+);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // Fetch from URL
      const fetchResponse = await fetch(imageUrl);
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch image: ${fetchResponse.status}`);
      }
      imageBuffer = Buffer.from(await fetchResponse.arrayBuffer());
      mimeType = fetchResponse.headers.get('content-type') || 'image/jpeg';
    } else {
      throw new Error('Unsupported image URL format');
    }

    // Convert to base64 for Gemini
    const base64Image = imageBuffer.toString('base64');

    // Create prompt for filename generation
    // If prompt/changeDescription is provided, incorporate it into the filename
    let filenamePrompt = `Look at this image and generate a short, descriptive filename (without extension) that describes what's in the image.`;
    
    if (prompt || changeDescription) {
      const changeInfo = prompt || changeDescription;
      filenamePrompt += `\n\nThis image was edited with the following change: "${changeInfo}".`;
      filenamePrompt += `\n\nIncorporate this change into the filename to reflect what was modified.`;
    }
    
    filenamePrompt += `\n\nRequirements:
- Keep it under 40 characters
- Use lowercase letters, numbers, and hyphens only (no spaces, special characters, or underscores)
- Be descriptive but concise
- Focus on the main subject or content${prompt || changeDescription ? ' and the edit made' : ''}
- Examples: ${prompt || changeDescription ? '"portrait-dramatic-daylight", "landscape-cozy-evening", "product-midday-bright"' : '"wooden-desk-with-notebook", "sunset-over-mountains", "portrait-of-woman-smiling"'}

Return ONLY the filename, nothing else. No quotes, no explanation, just the filename.`;

    // Call Gemini with image using correct API
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image
        }
      },
      { text: filenamePrompt }
    ]);

    const response = await result.response;
    
    // Check for prompt blocking
    if (response.promptFeedback?.blockReason) {
      const { blockReason, blockReasonMessage } = response.promptFeedback;
      throw new Error(`Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`);
    }

    // Extract text response
    const candidates = response.candidates || [];
    if (candidates.length === 0) {
      throw new Error('No response from Gemini');
    }

    const textPart = candidates[0].content?.parts?.find(part => part.text);
    if (!textPart || !textPart.text) {
      throw new Error('No text in Gemini response');
    }

    let filename = textPart.text.trim();
    
    // Clean up filename - remove quotes, extra whitespace, and ensure it's filename-safe
    filename = filename
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/[^a-z0-9-]/g, '-') // Replace invalid chars with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .toLowerCase()
      .substring(0, 40); // Limit length

    // Fallback if filename is empty or too short
    if (!filename || filename.length < 3) {
      filename = 'devello-edited-image';
    }

    timer.end('Image name generated successfully');
    
    logger.info('Image name generated', { filename });

    return res.status(200).json({ filename });
    
  } catch (error) {
    timer.end('Image name generation failed');
    logger.error('Image name generation error', { 
      error: error.message,
      stack: error.stack
    });
    
    console.error('❌ [GENERATE_IMAGE_NAME] Error:', error);
    
    // Return fallback filename on error
    return res.status(200).json({ 
      filename: 'devello-edited-image',
      error: error.message 
    });
  }
};

export default withMiddleware(handler, {
  validation: {
    method: 'POST',
    requireBody: true,
    requiredFields: ['imageUrl']
  }
});

