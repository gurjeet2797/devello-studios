/**
 * Centralized edit points and hotspot counting/allowance logic
 * Refactored to consolidate all edit limit checks in one place
 */

// Constants for edit limits
export const EDIT_LIMITS = {
  MAX_EDITS_PER_IMAGE: 3,
  MAX_HOTSPOTS_PER_SESSION: 2,
  MAX_TOTAL_HOTSPOTS_PER_SESSION: 6,
  MAX_SESSIONS: 3
};

/**
 * Check if user can add more edit points/hotspots
 * @param {Object} params - Parameters object
 * @param {number} params.editCount - Current edit count
 * @param {number} params.hotspotCount - Current hotspot count in session
 * @param {number} params.totalHotspotsInSession - Total hotspots in current session
 * @param {boolean} params.hasActiveSession - Whether there's an active session
 * @returns {{canAdd: boolean, reason?: string}}
 */
export function canAddHotspot({ editCount = 0, hotspotCount = 0, totalHotspotsInSession = 0, hasActiveSession = false }) {
  // Ensure all parameters are valid numbers/booleans
  const safeEditCount = Number(editCount) || 0;
  const safeHotspotCount = Number(hotspotCount) || 0;
  const safeTotalHotspots = Number(totalHotspotsInSession) || 0;
  // Ensure hasActiveSession is a boolean (handle null/undefined)
  const hasActive = Boolean(hasActiveSession);
  
  console.log('🔍 [CAN_ADD_HOTSPOT] Checking:', {
    editCount: safeEditCount,
    hotspotCount: safeHotspotCount,
    totalHotspotsInSession: safeTotalHotspots,
    hasActiveSession: hasActive,
    maxEdits: EDIT_LIMITS.MAX_EDITS_PER_IMAGE
  });
  
  // Check edit limit (max 3 edits per image)
  if (safeEditCount >= EDIT_LIMITS.MAX_EDITS_PER_IMAGE) {
    console.log('❌ [CAN_ADD_HOTSPOT] Edit limit reached');
    return {
      canAdd: false,
      reason: 'Maximum 3 edits allowed per image. Please upload a new image to continue editing.'
    };
  }

  // Check if session exists and is active
  // If no active session, can always add (will create one)
  if (!hasActive) {
    console.log('✅ [CAN_ADD_HOTSPOT] No active session - allowing add');
    return {
      canAdd: true
    };
  }

  // Check edit phase limit (max 2 hotspots per edit phase)
  if (safeHotspotCount >= EDIT_LIMITS.MAX_HOTSPOTS_PER_SESSION) {
    console.log('❌ [CAN_ADD_HOTSPOT] Phase limit reached');
    return {
      canAdd: false,
      reason: `You've added ${EDIT_LIMITS.MAX_HOTSPOTS_PER_SESSION} edit points. Click "Process" to apply your changes.`
    };
  }

  // Check total session limit (max 6 hotspots total per session)
  if (safeTotalHotspots >= EDIT_LIMITS.MAX_TOTAL_HOTSPOTS_PER_SESSION) {
    console.log('❌ [CAN_ADD_HOTSPOT] Total session limit reached');
    return {
      canAdd: false,
      reason: `Maximum ${EDIT_LIMITS.MAX_TOTAL_HOTSPOTS_PER_SESSION} edit points allowed per session. Please process your edits.`
    };
  }

  console.log('✅ [CAN_ADD_HOTSPOT] All checks passed - allowing add');
  return { canAdd: true };
}

/**
 * Check if user can process edits
 * @param {Object} params - Parameters object
 * @param {number} params.editCount - Current edit count
 * @param {Array} params.hotspots - Array of hotspots
 * @returns {{canProcess: boolean, reason?: string, validHotspots: Array}}
 */
export function canProcessEdits({ editCount, hotspots = [] }) {
  // Check edit limit
  if (editCount >= EDIT_LIMITS.MAX_EDITS_PER_IMAGE) {
    return {
      canProcess: false,
      reason: 'Maximum 3 edits allowed per image. Please upload a new image to continue editing.',
      validHotspots: []
    };
  }

  // Filter hotspots with valid prompts
  const validHotspots = hotspots.filter(h => h.prompt && h.prompt.trim());

  // Check if there are any valid hotspots
  if (validHotspots.length === 0) {
    return {
      canProcess: false,
      reason: hotspots.length === 0 
        ? 'Please add edit points to your image first.'
        : 'Please add descriptions to your edit points.',
      validHotspots: []
    };
  }

  return {
    canProcess: true,
    validHotspots
  };
}

/**
 * Get remaining edits count
 * @param {number} editCount - Current edit count
 * @returns {number} - Remaining edits
 */
export function getRemainingEdits(editCount) {
  return Math.max(0, EDIT_LIMITS.MAX_EDITS_PER_IMAGE - editCount);
}

/**
 * Get remaining hotspots count for current edit phase
 * @param {number} hotspotCount - Current hotspot count in edit phase
 * @returns {number} - Remaining hotspots
 */
export function getRemainingHotspots(hotspotCount) {
  return Math.max(0, EDIT_LIMITS.MAX_HOTSPOTS_PER_SESSION - hotspotCount);
}

