/**
 * Image Standardization Utilities
 * Standardizes images to match a target aspect ratio by adding white bars
 * Uses sharp for Node.js server-side image processing
 */

/**
 * Get image dimensions and aspect ratio from URL or buffer
 * @param {string|Buffer} imageInput - Image URL or buffer
 * @returns {Promise<{width: number, height: number, aspectRatio: number}>}
 */
export async function getImageDimensions(imageInput) {
  // Dynamically import sharp
  let sharp;
  try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default || sharpModule;
  } catch (e) {
    throw new Error(`Failed to import sharp: ${e.message}`);
  }

  let imageBuffer;
  
  // Handle URL or buffer input
  if (typeof imageInput === 'string') {
    // Fetch image if it's a URL
    if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
      const response = await fetch(imageInput);
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } else if (imageInput.startsWith('data:')) {
      // Handle data URL
      const base64Data = imageInput.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      throw new Error('Unsupported image URL format');
    }
  } else if (Buffer.isBuffer(imageInput)) {
    imageBuffer = imageInput;
  } else {
    throw new Error('Invalid image input type');
  }

  const metadata = await sharp(imageBuffer).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    aspectRatio: metadata.width / metadata.height
  };
}

/**
 * Add white bars to match target aspect ratio
 * @param {string|Buffer} imageInput - Image URL, data URL, or buffer
 * @param {number} targetAspectRatio - Target aspect ratio (width/height)
 * @returns {Promise<Buffer>} - Standardized image buffer
 */
export async function standardizeImageAspectRatio(imageInput, targetAspectRatio) {
  // Dynamically import sharp
  let sharp;
  try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default || sharpModule;
  } catch (e) {
    throw new Error(`Failed to import sharp: ${e.message}`);
  }

  let imageBuffer;
  
  // Handle URL or buffer input
  if (typeof imageInput === 'string') {
    if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
      const response = await fetch(imageInput);
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } else if (imageInput.startsWith('data:')) {
      const base64Data = imageInput.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      throw new Error('Unsupported image URL format');
    }
  } else if (Buffer.isBuffer(imageInput)) {
    imageBuffer = imageInput;
  } else {
    throw new Error('Invalid image input type');
  }

  // Get image dimensions
  const imgDims = await getImageDimensions(imageBuffer);
  const imgAspectRatio = imgDims.aspectRatio;
  
  // If aspect ratios match (within tolerance), return original
  if (Math.abs(imgAspectRatio - targetAspectRatio) < 0.01) {
    console.log('📐 [STANDARDIZE] Aspect ratios match, returning original');
    return imageBuffer;
  }
  
  // Calculate target dimensions maintaining original image size
  let targetWidth, targetHeight;
  if (imgAspectRatio > targetAspectRatio) {
    // Image is wider - add vertical bars (letterboxing)
    targetWidth = imgDims.width;
    targetHeight = Math.round(imgDims.width / targetAspectRatio);
  } else {
    // Image is taller - add horizontal bars (pillarboxing)
    targetHeight = imgDims.height;
    targetWidth = Math.round(imgDims.height * targetAspectRatio);
  }
  
  console.log('📐 [STANDARDIZE] Standardizing image:', {
    original: { width: imgDims.width, height: imgDims.height, aspectRatio: imgAspectRatio.toFixed(3) },
    target: { width: targetWidth, height: targetHeight, aspectRatio: targetAspectRatio.toFixed(3) }
  });
  
  // Calculate centered position
  const x = Math.round((targetWidth - imgDims.width) / 2);
  const y = Math.round((targetHeight - imgDims.height) / 2);
  
  // Create standardized image with white background
  const standardized = await sharp({
    create: {
      width: targetWidth,
      height: targetHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })
    .composite([{
      input: imageBuffer,
      left: x,
      top: y
    }])
    .jpeg({ quality: 95 })
    .toBuffer();
  
  return standardized;
}

/**
 * Crop focused area and standardize to target aspect ratio
 * @param {string|Buffer} imageInput - Image URL, data URL, or buffer
 * @param {Object} focusPoint - Focus point {x: number, y: number} in percentage (0-100)
 * @param {number} targetAspectRatio - Target aspect ratio (width/height)
 * @param {number} cropSize - Fraction of image to crop (default: 0.3 = 30%)
 * @returns {Promise<Buffer>} - Cropped and standardized image buffer
 */
export async function cropAndStandardizeReference(imageInput, focusPoint, targetAspectRatio, cropSize = 0.3) {
  // Dynamically import sharp
  let sharp;
  try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default || sharpModule;
  } catch (e) {
    throw new Error(`Failed to import sharp: ${e.message}`);
  }

  let imageBuffer;
  
  // Handle URL or buffer input
  if (typeof imageInput === 'string') {
    if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
      const response = await fetch(imageInput);
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } else if (imageInput.startsWith('data:')) {
      const base64Data = imageInput.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      throw new Error('Unsupported image URL format');
    }
  } else if (Buffer.isBuffer(imageInput)) {
    imageBuffer = imageInput;
  } else {
    throw new Error('Invalid image input type');
  }

  // Get image dimensions
  const imgDims = await getImageDimensions(imageBuffer);
  
  // Calculate crop area around focus point
  const cropWidth = Math.round(imgDims.width * cropSize);
  const cropHeight = Math.round(imgDims.height * cropSize);
  
  // Calculate crop position (centered on focus point)
  const focusX = Math.round((focusPoint.x / 100) * imgDims.width);
  const focusY = Math.round((focusPoint.y / 100) * imgDims.height);
  
  const cropX = Math.max(0, Math.min(focusX - cropWidth / 2, imgDims.width - cropWidth));
  const cropY = Math.max(0, Math.min(focusY - cropHeight / 2, imgDims.height - cropHeight));
  
  console.log('✂️ [CROP] Cropping reference image:', {
    focusPoint: { x: focusPoint.x, y: focusPoint.y },
    cropArea: { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
    imageSize: { width: imgDims.width, height: imgDims.height }
  });
  
  // Crop the image
  const cropped = await sharp(imageBuffer)
    .extract({
      left: cropX,
      top: cropY,
      width: cropWidth,
      height: cropHeight
    })
    .jpeg({ quality: 95 })
    .toBuffer();
  
  // Now standardize the cropped image
  const standardized = await standardizeImageAspectRatio(cropped, targetAspectRatio);
  
  return standardized;
}

