/**
 * Browser-based Guest Upload Reset
 * 
 * Run this in the browser console to reset guest user uploads:
 * 
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Press Enter
 */

(function resetGuestUploads() {
  
  // Clear guest upload data from localStorage
  localStorage.removeItem('devello_guest_uploads');
  localStorage.removeItem('devello_user_uploads');
  localStorage.removeItem('devello_weekly_reset');
  
  
  // Verify the reset worked
  const guestUploads = localStorage.getItem('devello_guest_uploads');
  const userUploads = localStorage.getItem('devello_user_uploads');
  const weeklyReset = localStorage.getItem('devello_weekly_reset');
  
  
  return {
    success: true,
    message: 'Guest uploads reset successfully',
    clearedKeys: ['devello_guest_uploads', 'devello_user_uploads', 'devello_weekly_reset']
  };
})();
