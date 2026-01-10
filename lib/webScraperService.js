/**
 * Web Scraping Service for Vendor Pages
 * 
 * Fetches and parses vendor product pages to extract:
 * - Product name, description, price
 * - Images
 * - Structured data (JSON-LD, OpenGraph)
 * 
 * Required dependency: npm install cheerio
 */

import * as cheerio from 'cheerio';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Fetch a URL with timeout and error handling
 */
async function fetchWithTimeout(url, timeout = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

/**
 * Extract JSON-LD structured data from HTML
 */
function extractJsonLd($) {
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const results = [];
  
  jsonLdScripts.each((_, script) => {
    try {
      const content = $(script).html();
      if (content) {
        const data = JSON.parse(content);
        // Handle @graph format
        if (data['@graph']) {
          results.push(...data['@graph']);
        } else {
          results.push(data);
        }
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  });
  
  return results;
}

/**
 * Extract OpenGraph meta tags
 */
function extractOpenGraph($) {
  const og = {};
  
  $('meta[property^="og:"]').each((_, el) => {
    const property = $(el).attr('property')?.replace('og:', '');
    const content = $(el).attr('content');
    if (property && content) {
      og[property] = content;
    }
  });
  
  return og;
}

/**
 * Extract meta tags
 */
function extractMetaTags($) {
  const meta = {};
  
  $('meta[name]').each((_, el) => {
    const name = $(el).attr('name');
    const content = $(el).attr('content');
    if (name && content) {
      meta[name] = content;
    }
  });
  
  return meta;
}

/**
 * Extract product images from the page
 */
function extractImages($, baseUrl) {
  const images = [];
  const seen = new Set();
  
  // Priority selectors for product images
  const selectors = [
    '[data-product-image]',
    '.product-image img',
    '.product-gallery img',
    '#product-image',
    '[itemprop="image"]',
    '.main-image img',
    'figure img',
    '.gallery img'
  ];
  
  // Try priority selectors first
  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
      if (src && !seen.has(src)) {
        seen.add(src);
        images.push(resolveUrl(src, baseUrl));
      }
    });
    
    if (images.length >= 5) break;
  }
  
  // Fall back to all large images
  if (images.length === 0) {
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      const width = parseInt($(el).attr('width') || '0', 10);
      const height = parseInt($(el).attr('height') || '0', 10);
      
      // Skip small images, icons, logos
      if (src && !seen.has(src)) {
        const lowerSrc = src.toLowerCase();
        if (
          !lowerSrc.includes('logo') &&
          !lowerSrc.includes('icon') &&
          !lowerSrc.includes('sprite') &&
          !lowerSrc.includes('placeholder') &&
          (width === 0 || width >= 200) &&
          (height === 0 || height >= 200)
        ) {
          seen.add(src);
          images.push(resolveUrl(src, baseUrl));
        }
      }
    });
  }
  
  return images.slice(0, 10); // Limit to 10 images
}

/**
 * Resolve relative URLs to absolute
 */
function resolveUrl(url, baseUrl) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

/**
 * Extract price from text
 */
function extractPrice(text) {
  if (!text) return null;
  
  // Match common price patterns
  const patterns = [
    /\$\s*([\d,]+(?:\.\d{2})?)/,  // $1,234.56
    /USD\s*([\d,]+(?:\.\d{2})?)/i, // USD 1234.56
    /([\d,]+(?:\.\d{2})?)\s*(?:USD|dollars?)/i // 1234.56 USD
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(price) && price > 0) {
        return Math.round(price * 100); // Convert to cents
      }
    }
  }
  
  return null;
}

/**
 * Extract product data from common HTML patterns
 */
function extractProductFromHtml($) {
  const product = {
    name: null,
    description: null,
    price: null
  };
  
  // Name extraction priority
  const nameSources = [
    () => $('h1[itemprop="name"]').first().text(),
    () => $('.product-title').first().text(),
    () => $('.product-name').first().text(),
    () => $('[data-product-title]').first().text(),
    () => $('h1').first().text(),
    () => $('title').text().split('|')[0].split('-')[0]
  ];
  
  for (const source of nameSources) {
    const name = source()?.trim();
    if (name && name.length > 2 && name.length < 200) {
      product.name = name;
      break;
    }
  }
  
  // Description extraction
  const descSources = [
    () => $('[itemprop="description"]').first().text(),
    () => $('.product-description').first().text(),
    () => $('[data-product-description]').first().text(),
    () => $('meta[name="description"]').attr('content'),
    () => $('.description').first().text()
  ];
  
  for (const source of descSources) {
    const desc = source()?.trim();
    if (desc && desc.length > 20) {
      product.description = desc.substring(0, 2000);
      break;
    }
  }
  
  // Price extraction
  const priceSources = [
    () => $('[itemprop="price"]').attr('content'),
    () => $('[itemprop="price"]').text(),
    () => $('.price').first().text(),
    () => $('[data-price]').attr('data-price'),
    () => $('.product-price').first().text(),
    () => $('[class*="price"]').first().text()
  ];
  
  for (const source of priceSources) {
    const priceText = source();
    const price = extractPrice(priceText);
    if (price) {
      product.price = price;
      break;
    }
  }
  
  return product;
}

/**
 * Scrape a vendor product page and extract relevant data
 * 
 * @param {string} url - The URL to scrape
 * @returns {Promise<Object>} Extracted product data
 */
export async function scrapeVendorPage(url) {
  console.log(`[WEB_SCRAPER] Scraping: ${url}`);
  
  try {
    const html = await fetchWithTimeout(url);
    const $ = cheerio.load(html);
    
    // Extract structured data
    const jsonLdData = extractJsonLd($);
    const ogData = extractOpenGraph($);
    const metaTags = extractMetaTags($);
    
    // Find product schema in JSON-LD
    const productSchema = jsonLdData.find(item => 
      item['@type'] === 'Product' || 
      item['@type']?.includes?.('Product')
    );
    
    // Extract images
    const images = extractImages($, url);
    
    // Add OG image if present
    if (ogData.image && !images.includes(ogData.image)) {
      images.unshift(ogData.image);
    }
    
    // Extract HTML-based product data
    const htmlProduct = extractProductFromHtml($);
    
    // Combine all data sources, prioritizing structured data
    const result = {
      url,
      name: productSchema?.name || ogData.title || htmlProduct.name,
      description: productSchema?.description || ogData.description || metaTags.description || htmlProduct.description,
      price: null,
      currency: 'usd',
      images: images,
      brand: productSchema?.brand?.name || null,
      sku: productSchema?.sku || null,
      gtin: productSchema?.gtin || productSchema?.gtin13 || null,
      category: productSchema?.category || null,
      availability: productSchema?.offers?.availability || null,
      rawText: $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000),
      structured: {
        jsonLd: productSchema || null,
        openGraph: Object.keys(ogData).length > 0 ? ogData : null
      }
    };
    
    // Handle price from various sources
    if (productSchema?.offers) {
      const offers = Array.isArray(productSchema.offers) 
        ? productSchema.offers[0] 
        : productSchema.offers;
      if (offers.price) {
        result.price = Math.round(parseFloat(offers.price) * 100);
        result.currency = offers.priceCurrency?.toLowerCase() || 'usd';
      }
    } else if (htmlProduct.price) {
      result.price = htmlProduct.price;
    }
    
    console.log(`[WEB_SCRAPER] Extracted: ${result.name || 'No name found'}, ${images.length} images`);
    
    return result;
    
  } catch (error) {
    console.error(`[WEB_SCRAPER] Error scraping ${url}:`, error.message);
    return {
      url,
      error: error.message,
      name: null,
      description: null,
      price: null,
      images: [],
      rawText: null
    };
  }
}

/**
 * Scrape multiple URLs in parallel with rate limiting
 */
export async function scrapeMultipleUrls(urls, options = {}) {
  const { concurrency = 3, delayMs = 500 } = options;
  const results = [];
  
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(url => scrapeVendorPage(url))
    );
    results.push(...batchResults);
    
    // Add delay between batches
    if (i + concurrency < urls.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

/**
 * Download an image and return its buffer
 */
export async function downloadImage(imageUrl, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      throw new Error('Not an image');
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return {
      buffer,
      contentType,
      size: buffer.length
    };
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[WEB_SCRAPER] Failed to download image ${imageUrl}:`, error.message);
    return null;
  }
}

export default {
  scrapeVendorPage,
  scrapeMultipleUrls,
  downloadImage
};
