#!/usr/bin/env node

/**
 * Reset Guest User Uploads Script
 * 
 * This script resets the upload counts for all guest users by clearing
 * the localStorage data that tracks guest uploads.
 * 
 * Usage: node scripts/reset-guest-uploads.js
 */

const { resetAllUploads } = require('../lib/uploadLimits.js');


try {
  // Reset all upload counts
  resetAllUploads();
  
  
} catch (error) {
  console.error('❌ Error resetting guest uploads:', error);
  process.exit(1);
}
