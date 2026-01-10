/**
 * Job Processor for Product Research Engine
 * 
 * Orchestrates the pipeline:
 * 1. Parse PDF (if provided)
 * 2. Scrape vendor URL (if provided)
 * 3. Extract products using Gemini AI
 * 4. Download and upload images
 * 5. Save results
 */

import prismaClient from './prisma';
import { parsePDF, parsePageRange } from './pdfService';
import { scrapeVendorPage, downloadImage } from './webScraperService';
import { extractProducts } from './geminiResearchService';
import { createSupabaseServerClient } from './supabaseClient';

/**
 * Update job progress in the database
 */
async function updateJobProgress(jobId, progress, message, extraData = {}) {
  const prisma = prismaClient;
  if (!prisma) return;
  
  try {
    await prisma.productResearchJob.update({
      where: { id: jobId },
      data: {
        progress,
        message,
        ...extraData
      }
    });
  } catch (error) {
    console.error('[JOB_PROCESSOR] Failed to update progress:', error.message);
  }
}

/**
 * Download PDF from URL
 */
async function downloadPDF(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Extract target pages from instructions
 * Looks for patterns like "page 45", "pages 60-65", etc.
 */
function extractPagesFromInstructions(instructions) {
  if (!instructions) return [];
  
  const pages = new Set();
  
  // Match "page X" or "pages X-Y" patterns
  const pageMatches = instructions.matchAll(/pages?\s*(\d+(?:\s*[-–]\s*\d+)?(?:\s*,\s*\d+(?:\s*[-–]\s*\d+)?)*)/gi);
  
  for (const match of pageMatches) {
    const pageSpec = match[1];
    const parsed = parsePageRange(pageSpec.replace(/–/g, '-'));
    parsed.forEach(p => pages.add(p));
  }
  
  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Upload an image to Supabase storage
 */
async function uploadImageToStorage(imageBuffer, contentType, jobId, index) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    throw new Error('Storage service not available');
  }
  
  const ext = contentType?.split('/')[1] || 'jpg';
  const timestamp = Date.now();
  const fileName = `products/imported/${jobId}/${timestamp}-${index}.${ext}`;
  
  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(fileName, imageBuffer, {
      contentType: contentType || 'image/jpeg',
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) {
    throw uploadError;
  }
  
  const { data: urlData } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);
  
  return urlData.publicUrl;
}

/**
 * Download and upload images for products
 */
async function processProductImages(products, jobId, maxImages = 3) {
  const updatedProducts = [];
  
  for (const product of products) {
    const newImages = [];
    const sourceImages = product.images || [];
    
    // Download and upload up to maxImages per product
    for (let i = 0; i < Math.min(sourceImages.length, maxImages); i++) {
      const imageUrl = sourceImages[i];
      if (!imageUrl || !imageUrl.startsWith('http')) continue;
      
      try {
        const downloaded = await downloadImage(imageUrl);
        if (downloaded?.buffer) {
          const uploadedUrl = await uploadImageToStorage(
            downloaded.buffer,
            downloaded.contentType,
            jobId,
            `${products.indexOf(product)}-${i}`
          );
          newImages.push(uploadedUrl);
        }
      } catch (error) {
        console.warn(`[JOB_PROCESSOR] Failed to process image ${imageUrl}:`, error.message);
        // Keep original URL as fallback
        newImages.push(imageUrl);
      }
    }
    
    updatedProducts.push({
      ...product,
      images: newImages.length > 0 ? newImages : product.images
    });
  }
  
  return updatedProducts;
}

/**
 * Main job processing function
 */
export async function processJob(jobId) {
  const prisma = prismaClient;
  if (!prisma) {
    throw new Error('Database not available');
  }
  
  console.log(`[JOB_PROCESSOR] Starting job ${jobId}`);
  
  // Fetch job
  const job = await prisma.productResearchJob.findUnique({
    where: { id: jobId }
  });
  
  if (!job) {
    throw new Error('Job not found');
  }
  
  if (job.status !== 'queued') {
    console.log(`[JOB_PROCESSOR] Job ${jobId} is not queued (status: ${job.status})`);
    return;
  }
  
  // Mark as processing
  await updateJobProgress(jobId, 5, 'Starting job...', {
    status: 'processing',
    started_at: new Date()
  });
  
  const errors = [];
  let pdfData = null;
  let urlData = null;
  
  // Cost tracking
  const costBreakdown = {
    gemini: 0,
    vision: 0,
    storage: 0
  };
  
  try {
    const { pdfUrl, vendorUrl, instructions, options } = job.inputs || {};
    
    // Step 1: Parse PDF if provided
    if (pdfUrl) {
      await updateJobProgress(jobId, 10, 'Downloading PDF...');
      
      try {
        const pdfBuffer = await downloadPDF(pdfUrl);
        
        await updateJobProgress(jobId, 20, 'Parsing PDF...');
        
        // Extract target pages from instructions
        const targetPages = extractPagesFromInstructions(instructions);
        
        pdfData = await parsePDF(pdfBuffer, {
          pages: targetPages.length > 0 ? targetPages : [], // Empty = all pages
          enableOCR: true
        });
        
        // Track OCR costs
        if (pdfData.ocrCost) {
          costBreakdown.vision += pdfData.ocrCost;
        }
        
        console.log(`[JOB_PROCESSOR] PDF parsed: ${pdfData.pagesProcessed} pages, OCR used: ${pdfData.ocrUsed}, OCR cost: $${(pdfData.ocrCost || 0).toFixed(6)}`);
        
      } catch (pdfError) {
        console.error('[JOB_PROCESSOR] PDF parsing error:', pdfError.message);
        errors.push(`PDF parsing failed: ${pdfError.message}`);
      }
    }
    
    // Step 2: Scrape vendor URL if provided
    if (vendorUrl) {
      await updateJobProgress(jobId, 35, 'Fetching vendor page...');
      
      try {
        urlData = await scrapeVendorPage(vendorUrl);
        
        if (urlData.error) {
          errors.push(`Vendor page error: ${urlData.error}`);
        } else {
          console.log(`[JOB_PROCESSOR] URL scraped: ${urlData.name || 'No name'}, ${urlData.images?.length || 0} images`);
        }
        
      } catch (urlError) {
        console.error('[JOB_PROCESSOR] URL scraping error:', urlError.message);
        errors.push(`URL scraping failed: ${urlError.message}`);
      }
    }
    
    // Check if we have any data to process
    if (!pdfData && !urlData && !instructions) {
      throw new Error('No data available for extraction');
    }
    
    // Step 3: Extract products using Gemini
    await updateJobProgress(jobId, 50, 'Extracting products with AI...');
    
    const extractionResult = await extractProducts({
      instructions,
      pdfData,
      urlData,
      category: options?.category,
      generateSEO: options?.generateSEO !== false,
      jobId
    });
    
    console.log(`[JOB_PROCESSOR] Extraction complete: ${extractionResult.products?.length || 0} products`);
    
    // Track Gemini costs
    if (extractionResult.cost) {
      costBreakdown.gemini += extractionResult.cost;
    }
    
    // Add any extraction errors
    if (extractionResult.errors?.length > 0) {
      errors.push(...extractionResult.errors);
    }
    
    let products = extractionResult.products || [];
    
    // Step 4: Process images if enabled and products have images
    if (options?.fetchImages !== false && products.some(p => p.images?.length > 0)) {
      await updateJobProgress(jobId, 75, 'Processing images...');
      
      try {
        const imageCount = products.reduce((sum, p) => sum + (p.images?.length || 0), 0);
        products = await processProductImages(products, jobId);
        
        // Estimate storage cost: $0.021 per GB/month, prorated per upload
        // Rough estimate: ~$0.0001 per image upload (assuming ~100KB per image)
        const estimatedStorageCost = imageCount * 0.0001;
        costBreakdown.storage += estimatedStorageCost;
      } catch (imageError) {
        console.error('[JOB_PROCESSOR] Image processing error:', imageError.message);
        errors.push(`Image processing: ${imageError.message}`);
      }
    }
    
    // Step 5: Save results
    await updateJobProgress(jobId, 95, 'Saving results...');
    
    // Calculate total cost
    const totalCost = costBreakdown.gemini + costBreakdown.vision + costBreakdown.storage;
    
    const results = {
      products,
      errors: extractionResult.errors || [],
      suggestions: extractionResult.suggestions || [],
      model: extractionResult.model,
      executionTime: extractionResult.executionTime,
      pdfInfo: pdfData ? {
        pagesProcessed: pdfData.pagesProcessed,
        ocrUsed: pdfData.ocrUsed
      } : null,
      urlInfo: urlData ? {
        url: urlData.url,
        name: urlData.name
      } : null
    };
    
    // Mark as completed
    await prisma.productResearchJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        message: `Found ${products.length} products`,
        results,
        errors: errors.length > 0 ? errors : null,
        total_cost: totalCost,
        cost_breakdown: costBreakdown,
        completed_at: new Date()
      }
    });
    
    console.log(`[JOB_PROCESSOR] Job ${jobId} completed: ${products.length} products, Total cost: $${totalCost.toFixed(6)}`);
    
    console.log(`[JOB_PROCESSOR] Job ${jobId} completed: ${products.length} products`);
    
    return results;
    
  } catch (error) {
    console.error(`[JOB_PROCESSOR] Job ${jobId} failed:`, error.message);
    
    // Mark as failed
    await prisma.productResearchJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        message: error.message,
        errors: [...errors, error.message],
        completed_at: new Date()
      }
    });
    
    throw error;
  }
}

/**
 * Process any queued jobs (for cron/worker trigger)
 */
export async function processQueuedJobs() {
  const prisma = prismaClient;
  if (!prisma) return { processed: 0 };
  
  // Find oldest queued job
  const job = await prisma.productResearchJob.findFirst({
    where: { status: 'queued' },
    orderBy: { created_at: 'asc' }
  });
  
  if (!job) {
    console.log('[JOB_PROCESSOR] No queued jobs found');
    return { processed: 0 };
  }
  
  await processJob(job.id);
  return { processed: 1, jobId: job.id };
}

export default {
  processJob,
  processQueuedJobs
};
