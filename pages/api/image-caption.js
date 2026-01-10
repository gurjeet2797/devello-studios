import Replicate from "replicate";
import { withMiddleware } from '../../lib/middleware.js';
import { createLogger } from '../../lib/logger.js';

const logger = createLogger('image-caption-api');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const handler = async (req, res) => {
  const timer = logger.startTimer('image-caption');
  
  // Debug environment variables
  logger.info('Environment check', {
    hasReplicateToken: !!process.env.REPLICATE_API_TOKEN,
    tokenPrefix: process.env.REPLICATE_API_TOKEN?.substring(0, 10) + '...',
    nodeEnv: process.env.NODE_ENV
  });
  
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "No image URL provided" });
    }


    logger.info('Creating image caption', { imageUrl });

    const input = {
      image: imageUrl,
      task_input: "More Detailed Caption"
    };

    // Log the exact input being sent to Florence-2
    logger.info('Florence-2 input', {
      model: "lucataco/florence-2-base:c81609117f666d3a86b262447f80d41ac5158a76adb56893301843a23165eaf8",
      input: input,
      imageUrl: imageUrl,
      task_input: "More Detailed Caption"
    });

    
    // Reduced timeout for faster failure
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Florence-2 API timeout after 25 seconds')), 25000);
    });
    
    const replicatePromise = replicate.run(
      "lucataco/florence-2-base:c81609117f666d3a86b262447f80d41ac5158a76adb56893301843a23165eaf8", 
      { input }
    );
    
    const output = await Promise.race([replicatePromise, timeoutPromise]);

    // Log the raw output from Florence-2
    logger.info('Florence-2 output', {
      output: output,
      outputType: typeof output,
      outputKeys: output && typeof output === 'object' ? Object.keys(output) : 'N/A'
    });

    timer.end('Image caption created successfully');
    
    logger.info('Image caption created', { 
      caption: output,
      imageUrl
    });

    // Parse the caption from Florence-2 output
    let parsedCaption = output;
    if (output && output.text && typeof output.text === 'string') {
      try {
        // Extract the caption from the Florence-2 format for "More Detailed Caption"
        const captionMatch = output.text.match(/'<MORE_DETAILED_CAPTION>':\s*'([^']+)'/);
        if (captionMatch) {
          parsedCaption = captionMatch[1];
        }
      } catch (error) {
        logger.error('Failed to parse Florence-2 caption', { error: error?.message });
      }
    }

    // Log the caption to console for debugging
    logger.info('Caption result', {
      imageUrl,
      rawOutput: output,
      parsedCaption
    });

    return res.status(200).json({ 
      caption: parsedCaption,
      rawOutput: output,
      imageUrl 
    });
    
  } catch (error) {
    timer.end('Image caption failed');
    logger.error('Image caption failed', { error: error.message });
    logger.error('❌ Image caption error', { error: error?.message });
    logger.error('❌ Image caption error details', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    return res.status(500).json({ 
      error: "Failed to generate image caption",
      details: error.message,
      type: error.name,
      code: error.code
    });
  }
};

export default withMiddleware(handler);
