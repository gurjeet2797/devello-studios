/**
 * PDF Processing Service
 * 
 * Uses pdfjs-dist for text extraction and image detection,
 * with Google Cloud Vision API fallback for OCR on scanned pages.
 * 
 * Required dependencies: npm install pdfjs-dist @google-cloud/vision
 */

// Dynamic import for pdfjs-dist to avoid SSR issues
let pdfjsLib = null;

async function getPdfjs() {
  if (!pdfjsLib) {
    // Use legacy build for Node.js compatibility
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLib;
}

/**
 * Detect if a page is likely scanned (image-only, minimal text)
 */
function isLikelyScannedPage(textContent, pageWidth, pageHeight) {
  if (!textContent || !textContent.items || textContent.items.length === 0) {
    return true;
  }
  
  // If very few text items relative to page size, likely scanned
  const textDensity = textContent.items.length / (pageWidth * pageHeight) * 10000;
  return textDensity < 0.5;
}

/**
 * Extract text from a single page
 */
async function extractPageText(page) {
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1.0 });
  
  // Check if page appears to be scanned
  const isScanned = isLikelyScannedPage(textContent, viewport.width, viewport.height);
  
  // Combine text items into a single string, preserving some structure
  const textItems = textContent.items.map(item => item.str).filter(Boolean);
  const text = textItems.join(' ').replace(/\s+/g, ' ').trim();
  
  return {
    text,
    isScanned,
    pageWidth: viewport.width,
    pageHeight: viewport.height,
    itemCount: textContent.items.length
  };
}

/**
 * Perform OCR on a page image using Google Cloud Vision
 * Returns cost estimate: $1.50 per 1,000 images (first 1,000 free per month)
 */
async function ocrPageWithVision(imageBuffer) {
  try {
    // Dynamic import to avoid loading if not needed
    const vision = await import('@google-cloud/vision');
    const client = new vision.ImageAnnotatorClient();
    
    const [result] = await client.textDetection({
      image: { content: imageBuffer.toString('base64') }
    });
    
    const detections = result.textAnnotations;
    
    // Calculate cost: $1.50 per 1,000 images (after first 1,000 free/month)
    // For simplicity, we'll track all usage. In production, you'd track monthly free tier
    const costPerImage = 0.0015; // $1.50 / 1000
    
    if (detections && detections.length > 0) {
      // First detection contains the full text
      return {
        text: detections[0].description || '',
        confidence: detections[0].confidence || 0.8,
        cost: costPerImage
      };
    }
    
    return { text: '', confidence: 0, cost: costPerImage };
  } catch (error) {
    console.error('[PDF_SERVICE] Vision OCR error:', error.message);
    return { text: '', confidence: 0, error: error.message, cost: 0 };
  }
}

/**
 * Render a page to an image buffer for OCR
 * Note: This requires the 'canvas' package which is optional.
 * If not available, OCR will be skipped for scanned pages.
 */
async function renderPageToImage(page, scale = 2.0) {
  // Only run in Node.js environment
  if (typeof window !== 'undefined' || typeof require === 'undefined') {
    return null;
  }
  
  try {
    // Use require with webpack ignore to avoid bundling issues
    // eslint-disable-next-line
    const canvas = require('canvas');
    const { createCanvas } = canvas;
    
    if (!createCanvas) {
      return null;
    }
    
    const viewport = page.getViewport({ scale });
    const canvasInstance = createCanvas(viewport.width, viewport.height);
    const context = canvasInstance.getContext('2d');
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    return canvasInstance.toBuffer('image/png');
  } catch (error) {
    // Canvas package not installed or not available
    console.warn('[PDF_SERVICE] Canvas not available, OCR disabled:', error.message);
    return null;
  }
}

/**
 * Parse a PDF file and extract text by page
 * 
 * @param {Buffer|ArrayBuffer} pdfBuffer - The PDF file as a buffer
 * @param {Object} options - Parsing options
 * @param {number[]} options.pages - Specific pages to extract (1-indexed), empty = all
 * @param {boolean} options.enableOCR - Enable OCR for scanned pages
 * @returns {Promise<Object>} Parsed PDF data
 */
export async function parsePDF(pdfBuffer, options = {}) {
  const { pages: targetPages = [], enableOCR = true } = options;
  
  const pdfjs = await getPdfjs();
  
  console.log('[PDF_SERVICE] Parsing PDF...');
  
  // Convert Buffer to Uint8Array if needed
  const data = pdfBuffer instanceof Buffer 
    ? new Uint8Array(pdfBuffer) 
    : pdfBuffer;
  
  const pdf = await pdfjs.getDocument({ data }).promise;
  const numPages = pdf.numPages;
  
  console.log(`[PDF_SERVICE] PDF has ${numPages} pages`);
  
  // Determine which pages to process
  const pagesToProcess = targetPages.length > 0
    ? targetPages.filter(p => p >= 1 && p <= numPages)
    : Array.from({ length: numPages }, (_, i) => i + 1);
  
  const textByPage = {};
  const images = [];
  const ocrResults = [];
  let ocrUsed = false;
  let totalOcrCost = 0;
  
  for (const pageNum of pagesToProcess) {
    try {
      const page = await pdf.getPage(pageNum);
      const pageResult = await extractPageText(page);
      
      if (pageResult.isScanned && enableOCR && pageResult.text.length < 50) {
        // Page appears to be scanned, attempt OCR
        console.log(`[PDF_SERVICE] Page ${pageNum} appears scanned, attempting OCR...`);
        
        const imageBuffer = await renderPageToImage(page);
        if (imageBuffer) {
          const ocrResult = await ocrPageWithVision(imageBuffer);
          if (ocrResult.text) {
            textByPage[pageNum] = ocrResult.text;
            ocrResults.push({
              page: pageNum,
              confidence: ocrResult.confidence,
              charCount: ocrResult.text.length,
              cost: ocrResult.cost || 0
            });
            totalOcrCost += ocrResult.cost || 0;
            ocrUsed = true;
            continue;
          }
        }
      }
      
      textByPage[pageNum] = pageResult.text;
      
      // Extract embedded images info (not the actual images, just metadata)
      const ops = await page.getOperatorList();
      const imgCount = ops.fnArray.filter(fn => 
        fn === pdfjs.OPS.paintImageXObject || 
        fn === pdfjs.OPS.paintInlineImageXObject
      ).length;
      
      if (imgCount > 0) {
        images.push({
          page: pageNum,
          count: imgCount
        });
      }
      
    } catch (error) {
      console.error(`[PDF_SERVICE] Error processing page ${pageNum}:`, error.message);
      textByPage[pageNum] = `[Error: Could not extract text from page ${pageNum}]`;
    }
  }
  
  return {
    numPages,
    pagesProcessed: pagesToProcess.length,
    textByPage,
    images,
    ocrUsed,
    ocrResults,
    ocrCost: totalOcrCost
  };
}

/**
 * Extract specific pages from a PDF based on search terms
 * 
 * @param {Buffer} pdfBuffer - The PDF file
 * @param {string[]} searchTerms - Terms to search for
 * @returns {Promise<Object>} Pages containing the search terms
 */
export async function findPagesWithTerms(pdfBuffer, searchTerms) {
  const { textByPage } = await parsePDF(pdfBuffer, { enableOCR: false });
  
  const matchingPages = {};
  
  for (const [pageNum, text] of Object.entries(textByPage)) {
    const lowerText = text.toLowerCase();
    const matches = searchTerms.filter(term => 
      lowerText.includes(term.toLowerCase())
    );
    
    if (matches.length > 0) {
      matchingPages[pageNum] = {
        text,
        matchedTerms: matches
      };
    }
  }
  
  return matchingPages;
}

/**
 * Parse page range string into array of page numbers
 * Examples: "1-5" -> [1,2,3,4,5], "1,3,5" -> [1,3,5], "1-3,7,9-10" -> [1,2,3,7,9,10]
 */
export function parsePageRange(rangeStr) {
  const pages = new Set();
  
  const parts = rangeStr.split(',').map(s => s.trim());
  
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          pages.add(i);
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num)) {
        pages.add(num);
      }
    }
  }
  
  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Get a summary of PDF content for preview
 */
export async function getPDFSummary(pdfBuffer) {
  const pdfjs = await getPdfjs();
  
  const data = pdfBuffer instanceof Buffer 
    ? new Uint8Array(pdfBuffer) 
    : pdfBuffer;
  
  const pdf = await pdfjs.getDocument({ data }).promise;
  const metadata = await pdf.getMetadata().catch(() => ({}));
  
  // Get first page text for preview
  const firstPage = await pdf.getPage(1);
  const { text } = await extractPageText(firstPage);
  
  return {
    numPages: pdf.numPages,
    title: metadata.info?.Title || null,
    author: metadata.info?.Author || null,
    subject: metadata.info?.Subject || null,
    preview: text.substring(0, 500) + (text.length > 500 ? '...' : '')
  };
}

export default {
  parsePDF,
  findPagesWithTerms,
  parsePageRange,
  getPDFSummary
};
