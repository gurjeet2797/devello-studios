import { createSupabaseServerClient } from '../../lib/supabaseClient';
import { uploadLimits } from '../../lib/uploadLimits';
import { withMiddleware } from '../../lib/middleware';
import { generateUniqueFilename } from '../../lib/upload/sanitization';
import { validateFileMetadata } from '../../lib/upload/validation';
import { verifyAuth } from '../../lib/authMiddleware';

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseServerClient();
    const { fileName, fileType, fileSize } = req.body;

    // Validate input
    if (!fileName || !fileType || !fileSize) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // SECURITY: Validate file metadata (type, size, extension)
    try {
      validateFileMetadata(fileType, fileSize, fileName);
    } catch (validationError) {
      return res.status(400).json({ 
        error: validationError.message || 'File validation failed'
      });
    }

    // SECURITY: Optional authentication check - if token present, verify user and check quota
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const { isAuthenticated, user } = await verifyAuth(req);
      
      if (isAuthenticated && user) {
        // Get Prisma user and check upload quota
        try {
          const { UserService } = await import('../../lib/userService');
          const { UploadAllowanceService } = await import('../../lib/uploadAllowanceService');
          
          const prismaUser = await UserService.getOrCreateUser(user.id, user.email);
          const canUpload = await UploadAllowanceService.canUpload(prismaUser.id);
          
          if (!canUpload) {
            return res.status(403).json({ 
              error: 'Upload limit reached',
              message: 'You have reached your upload limit. Please upgrade your plan or wait for your limit to reset.'
            });
          }
        } catch (quotaError) {
          console.error('❌ [DIRECT_UPLOAD] Error checking upload quota:', quotaError);
          // Continue with upload if quota check fails (fail open for now, but log the error)
        }
      }
    }

    // SECURITY: Generate unique filename with timestamp and sanitized name
    const uniqueFileName = generateUniqueFilename(fileName);

    // Create signed URL for direct upload
    const { data, error } = await supabase.storage
      .from('images')
      .createSignedUploadUrl(uniqueFileName);

    if (error) {
      console.error('❌ [DIRECT_UPLOAD] Error creating signed URL:', error);
      return res.status(500).json({ error: 'Failed to create upload URL' });
    }

    res.status(200).json({
      uploadUrl: data.signedUrl,
      fileName: uniqueFileName,
      fields: data.fields
    });

  } catch (error) {
    console.error('❌ [DIRECT_UPLOAD] Error:', error.message);
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// SECURITY: Apply rate limiting middleware (same as upload.js)
export default withMiddleware(handler, {
  rateLimit: true
}); 
