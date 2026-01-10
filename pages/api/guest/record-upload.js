import { GuestSessionService } from '../../../lib/guestSessionService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, uploadData, deviceFingerprint } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    if (!sessionId || !uploadData) {
      return res.status(400).json({ error: 'Session ID and upload data required' });
    }

    // Validate required fields
    if (!uploadData.fileName || !uploadData.fileSize || !uploadData.fileType) {
      return res.status(400).json({ error: 'Invalid upload data format' });
    }

    console.log('📝 [GUEST_RECORD] Recording guest upload:', {
      sessionId,
      fileName: uploadData.fileName,
      fileSize: uploadData.fileSize,
      uploadType: uploadData.uploadType,
      hasDeviceFingerprint: !!deviceFingerprint
    });

    let finalSessionId = sessionId;

    // Primary: Use device fingerprint to get/create session (device-based tracking)
    if (deviceFingerprint && deviceFingerprint.length <= 64) {
      try {
        const deviceSession = await GuestSessionService.getOrCreateSessionByDevice(
          deviceFingerprint,
          ip,
          userAgent
        );
        finalSessionId = deviceSession.id;
        console.log('✅ [GUEST_RECORD] Using device-based session:', finalSessionId);
      } catch (deviceError) {
        console.warn('⚠️ [GUEST_RECORD] Device-based lookup failed, using sessionId:', deviceError.message);
        // Fallback to sessionId-based lookup
        await GuestSessionService.createOrGetSession(
          sessionId, 
          deviceFingerprint, 
          ip, 
          userAgent
        );
      }
    } else {
      // Fallback: Use sessionId if no valid device fingerprint
      await GuestSessionService.createOrGetSession(
        sessionId, 
        deviceFingerprint || 'unknown', 
        ip, 
        userAgent
      );
    }

    // Record the upload using the final session ID
    const result = await GuestSessionService.recordUpload(finalSessionId, uploadData);

    console.log('✅ [GUEST_RECORD] Guest upload recorded successfully:', result.uploadStats);

    return res.status(200).json({
      success: true,
      uploadStats: result.uploadStats
    });
  } catch (error) {
    console.error('❌ [GUEST_RECORD] Error recording guest upload:', error);
    
    if (error.message === 'Guest upload limit reached') {
      return res.status(403).json({ 
        error: 'Upload limit reached',
        message: 'You have reached your upload limit. Please purchase additional uploads.'
      });
    }
    
    if (error.message === 'Guest session expired') {
      return res.status(410).json({ 
        error: 'Session expired',
        message: 'Your session has expired. Please refresh the page.'
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}