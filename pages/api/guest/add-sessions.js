// API endpoint to add 5 sessions to guest counter when code "MORE" is entered

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // Check if code is "MORE" (case-insensitive)
    if (code.toUpperCase() !== 'MORE') {
      return res.status(401).json({ error: 'Invalid code' });
    }

    // Get session ID from request or create one
    const sessionId = req.body.sessionId || req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Import guest session service
    const { GuestSessionService } = await import('../../../lib/guestSessionService');

    // Try to get session from database
    const prisma = (await import('../../../lib/prisma')).default;
    let currentLimit = 5;
    let uploadCount = 0;
    
    try {
      const session = await prisma.guestSession.findUnique({
        where: { id: sessionId }
      });
      
      if (session) {
        currentLimit = session.upload_limit || 5;
        uploadCount = session.upload_count || 0;
      }
    } catch (dbError) {
      // Session doesn't exist in DB, that's okay - use default
      console.log('Session not found in DB, using default limit');
    }

    // Reset limit to 5 (not add 5), keep current count
    const resetLimit = 5;
    
    // Try to update by device fingerprint first
    const deviceFingerprint = req.body.deviceFingerprint;
    if (deviceFingerprint && deviceFingerprint.length <= 64) {
      try {
        const deviceSession = await GuestSessionService.getOrCreateSessionByDevice(
          deviceFingerprint,
          req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
          req.headers['user-agent'] || 'unknown'
        );
        
        await prisma.guestSession.update({
          where: { id: deviceSession.id },
          data: { upload_limit: resetLimit }
        });
        
        return res.status(200).json({
          success: true,
          message: 'Sessions reset to 5',
          newLimit: resetLimit,
          remaining: Math.max(0, resetLimit - deviceSession.upload_count)
        });
      } catch (deviceError) {
        console.warn('Device-based update failed, trying sessionId:', deviceError.message);
      }
    }
    
    // Fallback: Update by sessionId
    try {
      await prisma.guestSession.upsert({
        where: { id: sessionId },
        update: { upload_limit: resetLimit },
        create: {
          id: sessionId,
          upload_limit: resetLimit,
          upload_count: 0,
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
          device_fingerprint: deviceFingerprint && deviceFingerprint.length <= 64 ? deviceFingerprint : null,
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
          user_agent: req.headers['user-agent'] || 'unknown'
        }
      });
    } catch (dbError) {
      // If DB update fails, that's okay - client will use localStorage
      console.log('DB update failed, client will use localStorage');
    }

    return res.status(200).json({
      success: true,
      message: 'Sessions reset to 5',
      newLimit: resetLimit,
      remaining: Math.max(0, resetLimit - uploadCount)
    });

  } catch (error) {
    console.error('Error adding sessions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
