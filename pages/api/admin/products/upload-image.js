import { verifyAdminAccess } from '../../../../lib/adminAuth';
import { createSupabaseServerClient } from '../../../../lib/supabaseClient';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Use require for formidable to avoid ESM import issues
const formidable = require('formidable');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(req);
    if (!authResult.isAdmin) {
      return res.status(401).json({ error: authResult.error || 'Unauthorized' });
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not available' });
    }

    // Parse form data
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const fileExtension = file.originalFilename?.split('.').pop() || 'jpg';
    const fileName = `products/${timestamp}-${randomId}.${fileExtension}`;

    // Read file buffer
    const fileBuffer = await fs.readFile(file.filepath);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    // Clean up temp file
    try {
      await fs.unlink(file.filepath);
    } catch (unlinkError) {
      console.warn('[ADMIN_PRODUCT_UPLOAD] Failed to delete temp file:', unlinkError);
    }

    if (uploadError) {
      console.error('[ADMIN_PRODUCT_UPLOAD] Upload error:', uploadError);
      return res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return res.status(200).json({
      success: true,
      url: urlData.publicUrl,
      fileName: uploadData.path,
    });
  } catch (error) {
    console.error('[ADMIN_PRODUCT_UPLOAD] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
    });
  }
}
