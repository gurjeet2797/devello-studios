import { getAuthenticatedUser } from '../../../lib/authUtils';
import { UploadAllowanceService } from '../../../lib/uploadAllowanceService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await getAuthenticatedUser(req, res);
    if (!auth) {
      return;
    }

    const { fileName, fileSize, fileType, uploadType, predictionId } = req.body;

    if (!fileName || !fileSize || !fileType || !uploadType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Upload record request:', {
      userId: auth.prismaUser.id,
      fileName,
      fileSize,
      fileType,
      uploadType
    });

    // Use new allowance service to check and record upload
    const result = await UploadAllowanceService.recordUpload(auth.prismaUser.id, {
      fileName,
      fileSize,
      fileType,
      uploadType,
      predictionId
    });

    console.log('Upload recorded successfully:', {
      uploadId: result.upload.id,
      remainingAllowance: result.allowance.remaining
    });

    return res.status(200).json({
      success: true,
      upload: result.upload,
      uploadStats: {
        uploadCount: result.allowance.used,
        uploadLimit: result.allowance.totalLimit,
        remaining: result.allowance.remaining,
        planType: result.allowance.planType,
        oneTimeCredits: result.allowance.oneTimeCredits
      }
    });
  } catch (error) {
    console.error('❌ [UPLOAD_RECORD_API] Record upload error:', error);
    
    if (error.message === 'Upload limit reached') {
      return res.status(403).json({ 
        error: 'Upload limit reached',
        message: 'You have reached your upload limit. Please upgrade your plan or purchase additional uploads.'
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
