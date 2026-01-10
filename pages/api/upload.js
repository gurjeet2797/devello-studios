import { withMiddleware } from '../../lib/middleware.js';
import { createSecureLogger } from '../../lib/secureLogger.js';
import { generateUniqueFilename } from '../../lib/upload/sanitization.js';
import { validateFileType } from '../../lib/upload/validation.js';
import { createSupabaseServerClient } from '../../lib/supabaseClient.js';
import prisma from '../../lib/prisma.js';

const logger = createSecureLogger('upload-api');

export const config = {
  api: {
    bodyParser: false,
  },
};

// Use require for formidable to avoid ESM import issues
const formidable = require('formidable');

const handler = async (req, res) => {
  const timer = logger.startTimer('file-upload');
  
  // Initialize Supabase client
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    console.error('❌ [UPLOAD] Failed to initialize Supabase client');
    res.status(500).json({ error: 'Database connection failed' });
    return;
  }
  
  
  let authContextCache;
  const getAuthContext = async () => {
    if (authContextCache !== undefined) {
      return authContextCache;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      authContextCache = null;
      return authContextCache;
    }

    const token = authHeader.substring(7);
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        authContextCache = null;
        return authContextCache;
      }

      const { UserService } = await import('../../lib/userService');
      const prismaUser = await UserService.getOrCreateUser(user.id, user.email);
      authContextCache = { supabaseUser: user, prismaUser };
      return authContextCache;
    } catch (err) {
      console.warn('⚠️ [UPLOAD] Auth context fetch failed:', err.message);
      authContextCache = null;
      return authContextCache;
    }
  };

  logger.info('File upload request received', {
    method: req.method,
    contentType: req.headers['content-type']
  });

  const form = new formidable.IncomingForm({
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFields: 10,
    maxFieldsSize: 2 * 1024 * 1024, // 2MB for fields
    allowEmptyFiles: false,
    minFileSize: 1024 // 1KB minimum
  });

  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        timer.end('File upload failed - parsing error');
        logger.error('Form parsing error', { error: err.message, code: err.code, httpCode: err.httpCode });
        console.error('❌ [UPLOAD] Form parsing error:', {
          message: err.message,
          code: err.code,
          httpCode: err.httpCode,
          contentLength: req.headers['content-length'],
          contentType: req.headers['content-type']
        });
        res.status(400).json({ 
          error: 'Error parsing form data',
          message: err.message,
          details: `Code: ${err.code}, HTTP: ${err.httpCode}`
        });
        resolve();
        return;
      }

      try {
        console.log('Upload form data received:', {
          fieldsReceived: Object.keys(fields),
          filesReceived: Object.keys(files),
          totalFiles: Object.keys(files).length
        });
        
        const fileField = files.file;
        const file = Array.isArray(fileField) ? fileField[0] : fileField;
        
        console.log('File processing debug:', {
          fileFieldExists: !!fileField,
          isArray: Array.isArray(fileField),
          fileExists: !!file,
          hasFilepath: !!(file && file.filepath),
          fileDetails: file ? {
            originalFilename: file.originalFilename,
            mimetype: file.mimetype,
            size: file.size,
            filepath: file.filepath
          } : null
        });
        
        if (!file || !file.filepath) {
          timer.end('File upload failed - no file');
          logger.warn('No file uploaded', { files: Object.keys(files), fileField: !!fileField });
          console.error('❌ [UPLOAD] No file uploaded:', {
            fileFieldExists: !!fileField,
            fileExists: !!file,
            files: Object.keys(files)
          });
          res.status(400).json({ 
            error: 'No file uploaded or file path missing',
            debug: {
              filesReceived: Object.keys(files),
              fileFieldExists: !!fileField,
              fileExists: !!file
            }
          });
          resolve();
          return;
        }

        // Validate file type and size
        console.log('File validation:', {
          mimetype: file.mimetype,
          originalFilename: file.originalFilename,
          size: file.size,
          sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
        });
        
        try {
          validateFileType({
            mimetype: file.mimetype,
            originalFilename: file.originalFilename,
          size: file.size
        });
        } catch (validationError) {
          console.error('❌ [UPLOAD] File validation failed:', validationError.message);
          throw validationError;
        }

        logger.info('File validation passed', {
          filename: file.originalFilename,
          mimetype: file.mimetype,
          size: file.size
        });

        // Sanitize filename and add timestamp
        const fileName = generateUniqueFilename(file.originalFilename);
            
            console.log('File naming:', {
              original: file.originalFilename,
              sanitized: fileName,
              size: file.size,
              type: file.mimetype
            });
        
        // Read file data
        const fs = await import('fs/promises');
        const fileData = await fs.readFile(file.filepath);
        
        logger.info('Uploading file to Supabase Storage', {
          filename: fileName,
          size: fileData.length,
          bucket: 'images'
        });




        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('images') // Create this bucket in Supabase dashboard
          .upload(fileName, fileData, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('❌ [UPLOAD] Supabase Storage error:', error);
          throw new Error(`Supabase Storage error: ${error.message}`);
        }


        // Get public URL
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);


        // Clean up temporary file with retry logic for Windows/OneDrive
        try {
          await fs.unlink(file.filepath);
        } catch (cleanupError) {
          // Retry once after a short delay for Windows EBUSY errors
          if (cleanupError.code === 'EBUSY' || cleanupError.code === 'EINVAL') {
            await new Promise(resolve => setTimeout(resolve, 100));
            try {
              await fs.unlink(file.filepath);
            } catch (retryError) {
              logger.warn('Failed to cleanup temp file after retry', { error: retryError.message });
              console.warn('⚠️ [UPLOAD] Failed to cleanup temp file after retry:', retryError.message);
            }
          } else {
            logger.warn('Failed to cleanup temp file', { error: cleanupError.message });
            console.warn('⚠️ [UPLOAD] Failed to cleanup temp file:', cleanupError.message);
          }
        }

        timer.end('File upload completed successfully');
        
        logger.info('File upload successful', {
          url: urlData.publicUrl,
          path: data.path,
          size: fileData.length
        });


        // Record the upload in the database (without counting towards limit)
        try {
          const authContext = await getAuthContext();
          if (authContext) {
            const { UserService } = await import('../../lib/userService');
            const { UploadAllowanceService } = await import('../../lib/uploadAllowanceService');
            const canUpload = await UploadAllowanceService.canUpload(authContext.prismaUser.id);
            
            if (!canUpload) {
              throw new Error('Upload limit reached');
            }
            
            // Record the upload (status: uploaded, not counted towards limit yet)
            await UserService.recordUploadWithoutCount(authContext.prismaUser.id, {
              fileName: file.originalFilename,
              fileSize: fileData.length,
              fileType: file.mimetype,
              uploadType: 'image_upload',
              predictionId: null
            });
          }
        } catch (recordError) {
          console.warn('⚠️ [UPLOAD] Failed to record upload:', recordError.message);
          console.warn('⚠️ [UPLOAD] Full record error:', recordError);
          // Don't fail the upload if recording fails
        }

        // Get the upload ID if it was recorded
        let uploadId = null;
        try {
          const authContext = await getAuthContext();
          if (authContext) {
            // Get the most recent upload for this user
            const recentUpload = await prisma.upload.findFirst({
              where: { 
                user_id: authContext.prismaUser.id,
                file_name: file.originalFilename,
                status: 'uploaded'
              },
              orderBy: { created_at: 'desc' }
            });
            uploadId = recentUpload?.id;
          }
        } catch (error) {
          console.warn('⚠️ [UPLOAD] Failed to get upload ID:', error.message);
        }

        res.status(200).json({ 
          url: urlData.publicUrl,
          path: data.path,
          uploadId: uploadId,
          message: 'File uploaded successfully to Supabase Storage'
        });
        resolve();
        
      } catch (error) {
        timer.end('File upload failed');
        logger.error('File upload error', { error: error.message });
        
        console.error('❌ [UPLOAD] Upload failed:', error.message);
        console.error('❌ [UPLOAD] Full error:', error);
        
        // Handle upload limit errors specifically
        if (error.message === 'Upload limit reached') {
          res.status(403).json({ 
            error: 'Upload limit reached',
            message: 'You have reached your upload limit. Please upgrade your plan or purchase additional uploads.'
          });
        } else {
          res.status(500).json({ 
            error: 'Failed to upload file to Supabase Storage',
            message: error.message 
          });
        }
        resolve();
      }
    });
  });
};

export default withMiddleware(handler, {
  validation: {
    method: 'POST'
  },
  rateLimit: true // Enable rate limiting for uploads
}); 
