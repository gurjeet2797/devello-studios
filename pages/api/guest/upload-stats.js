// API endpoint to get guest upload stats by device fingerprint or session ID

import { GuestSessionService } from '../../../lib/guestSessionService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, deviceFingerprint } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Primary: Try device fingerprint lookup
    if (deviceFingerprint && deviceFingerprint.length <= 64) {
      try {
        const deviceSession = await GuestSessionService.getOrCreateSessionByDevice(
          deviceFingerprint,
          ip,
          userAgent
        );
        
        return res.status(200).json({
          uploadCount: deviceSession.upload_count || 0,
          uploadLimit: deviceSession.upload_limit || 5,
          remaining: Math.max(0, (deviceSession.upload_limit || 5) - (deviceSession.upload_count || 0)),
          planType: 'guest',
          subscriptionStatus: 'none',
          isGuest: true
        });
      } catch (deviceError) {
        console.warn('⚠️ [GUEST_STATS] Device lookup failed:', deviceError.message);
      }
    }

    // Fallback: Use sessionId if provided
    if (sessionId) {
      try {
        const stats = await GuestSessionService.getUploadStats(sessionId);
        return res.status(200).json(stats);
      } catch (sessionError) {
        console.warn('⚠️ [GUEST_STATS] Session lookup failed:', sessionError.message);
      }
    }

    // Default: Return fresh 0/5 stats
    return res.status(200).json({
      uploadCount: 0,
      uploadLimit: 5,
      remaining: 5,
      planType: 'guest',
      subscriptionStatus: 'none',
      isGuest: true
    });

  } catch (error) {
    console.error('Error getting guest upload stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
