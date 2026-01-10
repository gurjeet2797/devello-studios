// Guest Session Service
// Handles server-side guest session tracking with device fingerprinting

import prisma from './prisma.js';

export class GuestSessionService {
  
  /**
   * Create or get existing guest session
   */
  static async createOrGetSession(sessionId, deviceFingerprint, ip, userAgent) {
    try {
      // Validate inputs
      if (!sessionId || !deviceFingerprint) {
        throw new Error('Session ID and device fingerprint are required');
      }

      // Try to get existing session
      let session = await prisma.guestSession.findUnique({
        where: { id: sessionId }
      });

      if (session) {
        // Update last activity (don't update device_fingerprint if it's too large)
        // Only update if the new fingerprint is reasonable size
        const updateData = {
          last_activity: new Date(),
          ip_address: ip?.substring(0, 45) || null, // Limit IP length
          user_agent: userAgent?.substring(0, 200) || null // Limit user agent length
        };
        
        // Only update device fingerprint if it's small enough (hashed should be 64 chars)
        if (deviceFingerprint && deviceFingerprint.length <= 64) {
          updateData.device_fingerprint = deviceFingerprint;
        }
        
        session = await prisma.guestSession.update({
          where: { id: sessionId },
          data: updateData
        });
        return session;
      }

      // Create new session (ensure device_fingerprint is hashed/small)
      const sessionData = {
        id: sessionId,
        device_fingerprint: deviceFingerprint && deviceFingerprint.length <= 64 
          ? deviceFingerprint 
          : null, // Don't store if too large
        ip_address: ip?.substring(0, 45) || null, // Limit IP length
        user_agent: userAgent?.substring(0, 200) || null, // Limit user agent length
        upload_count: 0,
        upload_limit: 5, // 5 sessions only
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        country_code: null, // Could be populated from IP geolocation
        is_mobile: this.detectMobile(userAgent),
        browser_name: this.extractBrowser(userAgent),
        os_name: this.extractOS(userAgent)
      };

      session = await prisma.guestSession.create({
        data: sessionData
      });

      console.log('✅ [GUEST_SESSION] Created new session:', sessionId);
      return session;
    } catch (error) {
      console.error('❌ [GUEST_SESSION] Error creating/getting session:', error);
      throw error;
    }
  }

  /**
   * Record an upload for a guest session
   */
  static async recordUpload(sessionId, uploadData) {
    try {
      // Get current session
      const session = await prisma.guestSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new Error('Guest session not found');
      }

      // Check if session is expired
      if (new Date() > session.expires_at) {
        throw new Error('Guest session expired');
      }

      // Check upload limit
      if (session.upload_count >= session.upload_limit) {
        throw new Error('Guest upload limit reached');
      }

      // Increment upload count
      const updatedSession = await prisma.guestSession.update({
        where: { id: sessionId },
        data: {
          upload_count: session.upload_count + 1,
          last_activity: new Date()
        }
      });

      console.log('✅ [GUEST_SESSION] Upload recorded:', {
        sessionId,
        uploadCount: updatedSession.upload_count,
        limit: updatedSession.upload_limit
      });

      return {
        success: true,
        session: updatedSession,
        uploadStats: {
          uploadCount: updatedSession.upload_count,
          uploadLimit: updatedSession.upload_limit,
          remaining: updatedSession.upload_limit - updatedSession.upload_count,
          planType: 'guest',
          subscriptionStatus: 'none',
          isGuest: true
        }
      };
    } catch (error) {
      console.error('❌ [GUEST_SESSION] Error recording upload:', error);
      throw error;
    }
  }

  /**
   * Get upload stats for a guest session
   */
  static async getUploadStats(sessionId) {
    try {
      const session = await prisma.guestSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        return {
          uploadCount: 0,
          uploadLimit: 5,
          remaining: 5,
          planType: 'guest',
          subscriptionStatus: 'none',
          isGuest: true
        };
      }

      return {
        uploadCount: session.upload_count,
        uploadLimit: session.upload_limit,
        remaining: session.upload_limit - session.upload_count,
        planType: 'guest',
        subscriptionStatus: 'none',
        isGuest: true
      };
    } catch (error) {
      console.error('❌ [GUEST_SESSION] Error getting upload stats:', error);
      throw error;
    }
  }

  /**
   * Check if guest can upload
   */
  static async canUpload(sessionId) {
    try {
      const session = await prisma.guestSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) return true; // New session, can upload
      if (new Date() > session.expires_at) return true; // Expired session, can upload
      
      return session.upload_count < session.upload_limit;
    } catch (error) {
      console.error('❌ [GUEST_SESSION] Error checking upload permission:', error);
      return true; // Default to allowing upload on error
    }
  }

  /**
   * Reset guest upload limits weekly
   */
  static async resetWeeklyLimits() {
    try {
      // Get current week number
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
      const currentWeek = Math.ceil((days + startOfYear.getDay() + 1) / 7);

      // Get last reset week from a system setting or use current week - 1
      const lastResetWeek = await this.getLastResetWeek();
      
      if (currentWeek > lastResetWeek) {
        // Reset all guest sessions
        const result = await prisma.guestSession.updateMany({
          data: {
            upload_count: 0,
            last_activity: new Date()
          }
        });

        // Update last reset week
        await this.setLastResetWeek(currentWeek);

        console.log(`🔄 [GUEST_SESSION] Weekly reset completed: ${result.count} sessions reset`);
        return result.count;
      }

      return 0; // No reset needed
    } catch (error) {
      console.error('❌ [GUEST_SESSION] Error resetting weekly limits:', error);
      throw error;
    }
  }

  /**
   * Get last reset week (stored in a simple way)
   */
  static async getLastResetWeek() {
    try {
      // You could store this in a system settings table
      // For now, we'll use a simple approach with guest sessions
      const lastSession = await prisma.guestSession.findFirst({
        orderBy: { created_at: 'desc' }
      });
      
      if (!lastSession) return 0;
      
      // Extract week from session creation date
      const sessionDate = new Date(lastSession.created_at);
      const startOfYear = new Date(sessionDate.getFullYear(), 0, 1);
      const days = Math.floor((sessionDate - startOfYear) / (24 * 60 * 60 * 1000));
      return Math.ceil((days + startOfYear.getDay() + 1) / 7);
    } catch (error) {
      console.error('❌ [GUEST_SESSION] Error getting last reset week:', error);
      return 0;
    }
  }

  /**
   * Set last reset week
   */
  static async setLastResetWeek(week) {
    // This could be stored in a system settings table
    // For now, we'll use a simple approach
    console.log(`📅 [GUEST_SESSION] Last reset week set to: ${week}`);
  }

  /**
   * Detect mobile device from user agent
   */
  static detectMobile(userAgent) {
    return /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  }

  /**
   * Extract browser name from user agent
   */
  static extractBrowser(userAgent) {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Extract OS name from user agent
   */
  static extractOS(userAgent) {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Get or create session by device fingerprint (primary method for device-based tracking)
   */
  static async getOrCreateSessionByDevice(deviceFingerprint, ip, userAgent) {
    try {
      if (!deviceFingerprint || deviceFingerprint.length > 64) {
        throw new Error('Invalid device fingerprint');
      }

      // Try to find existing session by device fingerprint
      let session = await prisma.guestSession.findFirst({
        where: {
          device_fingerprint: deviceFingerprint,
          expires_at: {
            gt: new Date() // Not expired
          }
        },
        orderBy: {
          last_activity: 'desc'
        }
      });

      if (session) {
        // Update last activity
        session = await prisma.guestSession.update({
          where: { id: session.id },
          data: {
            last_activity: new Date(),
            ip_address: ip?.substring(0, 45) || null,
            user_agent: userAgent?.substring(0, 200) || null
          }
        });
        return session;
      }

      // Create new session for this device
      const sessionId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const sessionData = {
        id: sessionId,
        device_fingerprint: deviceFingerprint,
        ip_address: ip?.substring(0, 45) || null,
        user_agent: userAgent?.substring(0, 200) || null,
        upload_count: 0,
        upload_limit: 5, // Always start with 5
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        country_code: null,
        is_mobile: this.detectMobile(userAgent),
        browser_name: this.extractBrowser(userAgent),
        os_name: this.extractOS(userAgent)
      };

      session = await prisma.guestSession.create({
        data: sessionData
      });

      console.log('✅ [GUEST_SESSION] Created new device session:', sessionId);
      return session;
    } catch (error) {
      console.error('❌ [GUEST_SESSION] Error getting/creating device session:', error);
      throw error;
    }
  }

  /**
   * Clean up expired sessions (called by cron job)
   */
  static async cleanupExpiredSessions() {
    try {
      const result = await prisma.guestSession.deleteMany({
        where: {
          expires_at: {
            lt: new Date()
          }
        }
      });

      console.log(`🧹 [GUEST_SESSION] Cleaned up ${result.count} expired sessions`);
      return result.count;
    } catch (error) {
      console.error('❌ [GUEST_SESSION] Error cleaning up expired sessions:', error);
      throw error;
    }
  }
}

export default GuestSessionService;
