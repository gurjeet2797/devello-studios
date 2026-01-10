/**
 * POST /api/admin/product-research/start
 * 
 * Initiate a new product research job.
 * Accepts PDF upload, vendor URL, and/or text instructions.
 */

import { verifyAdminAccess } from '../../../../lib/adminAuth';
import { createSupabaseServerClient } from '../../../../lib/supabaseClient';
import prismaClient from '../../../../lib/prisma';
import fs from 'fs/promises';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Use require for formidable to avoid ESM import issues
const formidable = require('formidable');

/**
 * Estimate processing time based on inputs
 */
function estimateTime(hasPdf, hasUrl, instructionLength) {
  let seconds = 10; // Base time
  
  if (hasPdf) seconds += 20;
  if (hasUrl) seconds += 10;
  if (instructionLength > 200) seconds += 10;
  
  return seconds;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[PRODUCT_RESEARCH_START] Prisma client not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;

  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(req);
    if (!authResult.isAdmin) {
      return res.status(401).json({ error: authResult.error || 'Unauthorized' });
    }

    const adminEmail = authResult.user?.email;

    // Parse form data using promise wrapper
    const parseFormData = () => {
      return new Promise((resolve, reject) => {
        const form = new formidable.IncomingForm({
          keepExtensions: true,
          maxFileSize: 50 * 1024 * 1024, // 50MB max for PDFs
          maxFields: 10,
          maxFieldsSize: 5 * 1024 * 1024, // 5MB for text fields
        });
        
        form.parse(req, (err, fields, files) => {
          if (err) {
            reject(err);
          } else {
            resolve({ fields, files });
          }
        });
      });
    };
    
    const { fields, files } = await parseFormData();

    // Extract form fields (formidable returns arrays or single values)
    const getField = (name) => {
      const value = fields[name];
      if (Array.isArray(value)) return value[0];
      return value || '';
    };

    const vendorUrl = getField('vendorUrl') || getField('url') || '';
    const instructions = getField('instructions') || '';
    const category = getField('category') || 'auto';
    const generateSEO = getField('generateSEO') !== 'false';
    const fetchImages = getField('fetchImages') !== 'false';
    const markAsTest = getField('markAsTest') === 'true';

    // Check for PDF file (formidable returns file object or array)
    let file = null;
    if (files.file) {
      file = Array.isArray(files.file) ? files.file[0] : files.file;
    } else if (files.pdf) {
      file = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;
    }
    let pdfUrl = null;

    // Validate that we have at least one input source
    if (!file && !vendorUrl && !instructions) {
      return res.status(400).json({
        error: 'At least one input is required: PDF file, vendor URL, or instructions'
      });
    }

    // Upload PDF to Supabase if provided
    if (file) {
      console.log('[PRODUCT_RESEARCH_START] Uploading PDF to storage...');
      
      const supabase = createSupabaseServerClient();
      if (!supabase) {
        return res.status(500).json({ error: 'Storage service not available' });
      }

      // Read file buffer
      const fileBuffer = await fs.readFile(file.filepath);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const fileName = `product-research/${timestamp}-${randomId}.pdf`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images') // Using existing bucket
        .upload(fileName, fileBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });

      // Clean up temp file
      try {
        await fs.unlink(file.filepath);
      } catch (unlinkError) {
        console.warn('[PRODUCT_RESEARCH_START] Failed to delete temp file:', unlinkError);
      }

      if (uploadError) {
        console.error('[PRODUCT_RESEARCH_START] Upload error:', uploadError);
        return res.status(500).json({ error: `PDF upload failed: ${uploadError.message}` });
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      pdfUrl = urlData.publicUrl;
      console.log('[PRODUCT_RESEARCH_START] PDF uploaded:', pdfUrl);
    }

    // Create job record
    let job;
    try {
      job = await prisma.productResearchJob.create({
        data: {
          status: 'queued',
          progress: 0,
          message: 'Job created, waiting to start...',
          admin_email: adminEmail,
          inputs: {
            pdfUrl,
            vendorUrl: vendorUrl || null,
            instructions: instructions || null,
            options: {
              category,
              generateSEO,
              fetchImages,
              markAsTest
            }
          }
        }
      });
    } catch (dbError) {
      console.error('[PRODUCT_RESEARCH_START] Database error:', dbError);
      // Check if it's a missing table error
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        return res.status(500).json({
          error: 'Database table not found. Please run: npx prisma db push',
          message: 'The product_research_jobs table has not been created yet.'
        });
      }
      throw dbError;
    }

    console.log('[PRODUCT_RESEARCH_START] Job created:', job.id);

    // Estimate processing time
    const estimatedTime = estimateTime(
      !!pdfUrl,
      !!vendorUrl,
      instructions?.length || 0
    );

    // Trigger async processing
    // In production, this would call a worker or edge function
    // For now, we'll trigger it via internal API call
    try {
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const processUrl = `${protocol}://${host}/api/admin/product-research/process`;
      
      // Fire and forget - don't await
      fetch(processUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization,
          'x-internal-call': 'true'
        },
        body: JSON.stringify({ jobId: job.id })
      }).catch(err => {
        console.warn('[PRODUCT_RESEARCH_START] Failed to trigger processing:', err.message);
      });
      
    } catch (triggerError) {
      console.warn('[PRODUCT_RESEARCH_START] Processing trigger error:', triggerError.message);
      // Don't fail the request - the job is created and can be picked up later
    }

    return res.status(200).json({
      success: true,
      jobId: job.id,
      status: 'queued',
      estimatedTime,
      message: 'Research job started'
    });

  } catch (error) {
    console.error('[PRODUCT_RESEARCH_START] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
