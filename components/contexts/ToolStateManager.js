import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { getSupabase } from '../../lib/supabaseClient';
import { getGuestUploadCount, getUploadLimit } from '../../lib/uploadLimits';
import { RefreshService } from '../../lib/refreshService';
import { getUploadStats as getUploadStatsFromLib } from '../../lib/uploadStats';

const createGuestUploadStats = () => {
  const limit = getUploadLimit(null);
  const usedCount = getGuestUploadCount();
  const used = Math.max(0, Math.min(limit, usedCount));
  // Compute remaining synchronously to avoid async Promise issues
  const remaining = Math.max(0, limit - used);

  return {
    uploadCount: used,
    uploadLimit: limit,
    remaining,
    planType: 'guest',
    subscriptionStatus: 'none',
    baseLimit: limit,
    baseUsed: used,
    oneTimeCredits: 0,
    totalCreditsGranted: 0,
    creditsUsed: 0,
    breakdown: {
      base: limit,
      credits: 0,
      total: limit,
      used,
      remaining
    },
    creditSummary: {
      base: {
        limit,
        used,
        remaining
      },
      credits: {
        granted: 0,
        used: 0,
        available: 0
      }
    },
    purchases: []
  };
};

// Tool state structure for each tool
const createInitialToolState = () => ({
  originalSrc: null,
  processedSrc: null,
  upscaledImage: null,
  showEnhanced: false,
  isProcessing: false,
  isUpscaling: false,
  isUploading: false,
  editHotspots: [],
  history: [],
  historyIndex: -1,
  customPrompt: '',
  lastEditPrompt: null, // Store the last prompt/change used for filename generation
  activeTab: 'retouch',
  containerDims: { width: '500px', height: '300px' },
  stableContainerDims: { width: '500px', height: '300px' },
  lightingOptions: {},
  uploadId: null,
  processingImageUrl: null,
  processError: null,
  upscaleError: null,
  imageReady: false,
  showEditFlow: false,
  originalImageForComparison: null,
  imageCaption: null,
  isCaptionPending: false,
  editCount: 0,
  uploadCounted: false,
  // New edit session management (Phase 1)
  editSessions: [],
  currentSession: null,
  maxSessions: 3,
  maxHotspotsPerSession: 2,
  maxHotspotsPerEditPhase: 2,
  maxTotalHotspotsPerSession: 6
});

// Global upload stats state
const createInitialUploadStats = () => ({
  data: null,
  lastUploadRefresh: null,
  loading: false,
  error: null
});

// Tool-specific background state
const createInitialToolBackgroundState = () => ({
  isBlack: false,
  hasImage: false,
  lastImageUpload: null
});

// Action types
const ACTION_TYPES = {
  UPDATE_TOOL_STATE: 'UPDATE_TOOL_STATE',
  RESET_TOOL_STATE: 'RESET_TOOL_STATE',
  CLEANUP_OLD_STATES: 'CLEANUP_OLD_STATES',
  UPDATE_LAST_ACTIVITY: 'UPDATE_LAST_ACTIVITY',
  UPDATE_UPLOAD_STATS: 'UPDATE_UPLOAD_STATS',
  SET_UPLOAD_STATS_LOADING: 'SET_UPLOAD_STATS_LOADING',
  SET_UPLOAD_STATS_ERROR: 'SET_UPLOAD_STATS_ERROR',
  UPDATE_TOOL_BACKGROUND_STATE: 'UPDATE_TOOL_BACKGROUND_STATE',
  RESET_TOOL_BACKGROUND_STATE: 'RESET_TOOL_BACKGROUND_STATE'
};

// Reducer function
const toolStateReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.UPDATE_TOOL_STATE:
      const newState = {
        ...state,
        [action.toolId]: {
          ...state[action.toolId],
          ...action.payload,
          lastActivity: Date.now()
        }
      };
      return newState;
    
    case ACTION_TYPES.RESET_TOOL_STATE:
      return {
        ...state,
        [action.toolId]: createInitialToolState()
      };
    
    case ACTION_TYPES.CLEANUP_OLD_STATES:
      const now = Date.now();
      const cleanedState = {};
      Object.keys(state).forEach(toolId => {
        const toolState = state[toolId];
        if (toolState && toolState.lastActivity && (now - toolState.lastActivity) < 30 * 60 * 1000) {
          cleanedState[toolId] = toolState;
        }
      });
      return cleanedState;
    
    case ACTION_TYPES.UPDATE_LAST_ACTIVITY:
      return {
        ...state,
        [action.toolId]: {
          ...state[action.toolId],
          lastActivity: Date.now()
        }
      };
    
    case ACTION_TYPES.UPDATE_UPLOAD_STATS:
      return {
        ...state,
        uploadStats: {
          ...state.uploadStats,
          data: action.payload,
          lastUploadRefresh: Date.now(),
          loading: false,
          error: null
        }
      };
    
    case ACTION_TYPES.SET_UPLOAD_STATS_LOADING:
      return {
        ...state,
        uploadStats: {
          ...state.uploadStats,
          loading: action.payload,
          error: action.payload ? null : state.uploadStats?.error
        }
      };
    
    case ACTION_TYPES.SET_UPLOAD_STATS_ERROR:
      return {
        ...state,
        uploadStats: {
          ...state.uploadStats,
          error: action.payload,
          loading: false
        }
      };
    
    case ACTION_TYPES.UPDATE_TOOL_BACKGROUND_STATE:
      return {
        ...state,
        [action.toolId]: {
          ...state[action.toolId],
          backgroundState: {
            ...state[action.toolId]?.backgroundState,
            ...action.payload
          }
        }
      };
    
    case ACTION_TYPES.RESET_TOOL_BACKGROUND_STATE:
      return {
        ...state,
        [action.toolId]: {
          ...state[action.toolId],
          backgroundState: createInitialToolBackgroundState()
        }
      };
    
    default:
      return state;
  }
};

// Context creation
export const ToolStateContext = createContext();

// Provider component
export function ToolStateProvider({ children }) {
  const [state, dispatch] = useReducer(toolStateReducer, {
    uploadStats: createInitialUploadStats()
  });

  const updateToolState = useCallback((toolId, updates) => {
    // Only log critical state changes to reduce console spam
    const criticalUpdates = Object.keys(updates).filter(key => 
      ['isProcessing', 'isUpscaling', 'showEnhanced'].includes(key)
    );
    
    if (criticalUpdates.length > 0) {
      // console.log('🔍 [TOOL_STATE_MANAGER] Critical state update:', { toolId, updates: criticalUpdates });
    }
    
    // Batch state updates to reduce re-renders
    dispatch({
      type: ACTION_TYPES.UPDATE_TOOL_STATE,
      toolId,
      payload: updates
    });
  }, []);

  const resetToolState = useCallback((toolId) => {
    dispatch({
      type: ACTION_TYPES.RESET_TOOL_STATE,
      toolId
    });
  }, []);

  const updateLastActivity = useCallback((toolId) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_LAST_ACTIVITY,
      toolId
    });
  }, []);

  const cleanupOldStates = useCallback(() => {
    dispatch({
      type: ACTION_TYPES.CLEANUP_OLD_STATES
    });
  }, []);

  const hasActiveWork = useCallback((toolId) => {
    const toolState = state[toolId];
    if (!toolState) return false;
    return !!(toolState.originalSrc || toolState.processedSrc || toolState.isProcessing || toolState.isUpscaling);
  }, [state]);

  const getToolState = useCallback((toolId) => {
    const toolState = state[toolId] || createInitialToolState();
    return {
      ...toolState,
      isActive: hasActiveWork(toolId),
      isProcessing: toolState.isProcessing || toolState.isUpscaling,
      isCompleted: toolState.showEnhanced && toolState.upscaledImage
    };
  }, [state, hasActiveWork]);

  const getActiveTools = useCallback(() => {
    return Object.keys(state).filter(toolId => hasActiveWork(toolId));
  }, [state, hasActiveWork]);

  const getPerformanceMetrics = useCallback(() => {
    const activeTools = getActiveTools();
    const totalMemory = activeTools.length * 50; // Rough estimate
    
    return {
      activeTools: activeTools.length,
      totalMemory: `${totalMemory}MB`,
      lastActivity: Math.max(...activeTools.map(toolId => state[toolId]?.lastActivity || 0))
    };
  }, [state, getActiveTools]);

  // Upload stats methods
  const pushUploadStats = useCallback((stats) => {
    dispatch({ type: ACTION_TYPES.UPDATE_UPLOAD_STATS, payload: stats });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('uploadStatsUpdated', {
        detail: stats
      }));
    }
  }, [dispatch]);

  const refreshUploadStats = useCallback(async () => {
    try {
      dispatch({ type: ACTION_TYPES.SET_UPLOAD_STATS_LOADING, payload: true });

      // Use unified upload stats function from lib/uploadStats.js
      // This respects the 30s cache and prevents duplicate API calls
      const stats = await getUploadStatsFromLib(false);
      
      pushUploadStats(stats);

    } catch (error) {
      // console.error('❌ [TOOL_STATE_MANAGER] Error refreshing upload stats:', error);
      // Fall back to guest stats on any error
      pushUploadStats(createGuestUploadStats());
      dispatch({ type: ACTION_TYPES.SET_UPLOAD_STATS_ERROR, payload: error.message });
    }
  }, [pushUploadStats]);

  const getUploadStats = useCallback(() => {
    return state.uploadStats?.data || null;
  }, [state.uploadStats]);

  const getUploadStatsLoading = useCallback(() => {
    return state.uploadStats?.loading || false;
  }, [state.uploadStats]);

  const getUploadStatsError = useCallback(() => {
    return state.uploadStats?.error || null;
  }, [state.uploadStats]);

  const markUploadAsProcessed = useCallback(async (toolId, predictionId = null) => {
    try {
      // Get the current tool state to find the uploadId
      const toolState = state[toolId];
      if (!toolState?.uploadId) {
        console.warn('No uploadId found for tool:', toolId, 'Current state:', toolState);
        // Wait a bit and try again in case of timing issue
        setTimeout(() => {
          const retryState = state[toolId];
          if (retryState?.uploadId) {
            console.log('Retrying markUploadAsProcessed with uploadId:', retryState.uploadId);
            markUploadAsProcessed(toolId, predictionId);
          }
        }, 1000);
        return;
      }

      // Check if this upload has already been counted towards the limit
      if (toolState.uploadCounted) {
        console.log('📋 [UPLOAD_COUNTER] Upload already counted, skipping upload limit decrement');
        return;
      }

      // Get session token for authentication
      const supabase = getSupabase();
      let headers = {
        'Content-Type': 'application/json',
      };
      
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch('/api/upload/mark-processed', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          uploadId: toolState.uploadId,
          predictionId,
          uploadType: toolId
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Upload marked as processed:', result);
        
        // Mark this upload as counted to prevent double-counting on subsequent edits
        updateToolState(toolId, { uploadCounted: true });
        
        // Use the updated upload stats from the API response directly
        if (result.uploadStats) {
          console.log('📊 [UPLOAD_COUNTER] Using updated stats from mark-processed response:', result.uploadStats);
          pushUploadStats(result.uploadStats);
        } else {
          // Fallback to refresh if no stats in response
          await refreshUploadStats();
        }
        
        return result;
      } else {
        console.error('Failed to mark upload as processed:', response.status);
      }
    } catch (error) {
      console.error('Error marking upload as processed:', error);
    }
  }, [state, refreshUploadStats, updateToolState]);

  // Tool-specific background state management
  const updateToolBackgroundState = useCallback((toolId, hasImage) => {
    const toolState = state[toolId];
    const currentBackgroundState = toolState?.backgroundState || createInitialToolBackgroundState();
    
    // Only update if there's a change for this specific tool
    if (hasImage && !currentBackgroundState.hasImage) {
      // Image was just uploaded - set black background
      dispatch({
        type: ACTION_TYPES.UPDATE_TOOL_BACKGROUND_STATE,
        toolId,
        payload: {
          isBlack: true,
          hasImage: true,
          lastImageUpload: Date.now()
        }
      });
    } else if (!hasImage && currentBackgroundState.hasImage) {
      // Image was reset - fade back to aurora/light rays
      dispatch({
        type: ACTION_TYPES.UPDATE_TOOL_BACKGROUND_STATE,
        toolId,
        payload: {
          isBlack: false,
          hasImage: false,
          lastImageUpload: null
        }
      });
    }
  }, [state]);

  const getToolBackgroundState = useCallback((toolId) => {
    const toolState = state[toolId];
    return toolState?.backgroundState || createInitialToolBackgroundState();
  }, [state]);

  const shouldShowBlackBackground = useCallback((toolId) => {
    const toolState = state[toolId];
    const backgroundState = toolState?.backgroundState || createInitialToolBackgroundState();
    const hasImage = toolState && (toolState.originalSrc || toolState.processedSrc);
    return backgroundState.isBlack && hasImage;
  }, [state]);

  // Polling logic for lighting tool
  const startLightingPolling = useCallback(async (toolId, predictionId, onComplete = null) => {
    // console.log('🔄 Starting lighting polling for prediction:', predictionId);
    
    // Set processing state in one batch
    updateToolState(toolId, { 
      isProcessing: true,
      processingImageUrl: null,
      processError: null,
      showEditFlow: false  // Hide interface during processing
    });

    // Set up timeout (3 minutes for mobile)
    const timeoutId = setTimeout(() => {
      // console.error('⏰ Polling timeout - processing took too long');
      updateToolState(toolId, {
        isProcessing: false,
        processError: 'Processing timeout - please try again'
      });
      if (onComplete) {
        onComplete(null, 'Processing timeout - please try again');
      }
    }, 3 * 60 * 1000); // 3 minutes for mobile

    let pollCount = 0;
    let consecutiveErrors = 0;
    const maxPolls = 60; // 3 minutes at 3-second intervals
    const maxConsecutiveErrors = 3; // Stop after 3 consecutive errors
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      // console.log(`📊 Polling status: processing for prediction: ${predictionId}`);
      
      try {
        const response = await fetch(`/api/predictions/status/${predictionId}`);
        
        // Check if response is ok and content type is JSON
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON');
        }
        
        const data = await response.json();
        
        if (data.status === 'succeeded') {
          clearInterval(pollInterval);
          clearTimeout(timeoutId);
          // console.log(`📊 Polling status: succeeded for prediction: ${predictionId}`);
          // console.log('✅ Lighting processing completed');
          
          // Reset error counter on success
          consecutiveErrors = 0;
          
          // Update state with result
          updateToolState(toolId, {
            isProcessing: false,
            processedSrc: data.output,
            showEditFlow: false
          });
          
          if (onComplete) {
            onComplete(data.output, null, true); // true = should upscale
          }
        } else if (data.status === 'failed' || data.status === 'Error' || data.status === 'error') {
          clearInterval(pollInterval);
          clearTimeout(timeoutId);
          
          // Extract error message from various possible fields
          const errorMessage = data.error || data.details || data.message || 'Image processing failed. Please try again.';
          
          console.error('❌ Lighting processing failed:', {
            status: data.status,
            error: errorMessage,
            predictionId: predictionId
          });
          
          updateToolState(toolId, {
            isProcessing: false,
            processError: errorMessage
          });
          
          if (onComplete) {
            onComplete(null, errorMessage);
          }
        } else if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          clearTimeout(timeoutId);
          // console.error('⏰ Max polls reached - processing timeout');
          
          updateToolState(toolId, {
            isProcessing: false,
            processError: 'Processing timeout - please try again'
          });
          
          if (onComplete) {
            onComplete(null, 'Processing timeout - please try again');
          }
        } else {
          // Reset error counter on successful response
          consecutiveErrors = 0;
        }
      } catch (error) {
        // console.error('❌ Polling error:', error);
        consecutiveErrors++;
        
        // Stop polling if we've reached max polls or too many consecutive errors
        if (pollCount >= maxPolls || consecutiveErrors >= maxConsecutiveErrors) {
          clearInterval(pollInterval);
          clearTimeout(timeoutId);
          
          const errorMessage = error.message.includes('HTTP 504') 
            ? 'Server timeout - please try again' 
            : error.message.includes('Response is not JSON')
            ? 'Server error - please try again'
            : consecutiveErrors >= maxConsecutiveErrors
            ? 'Too many connection errors - please try again'
            : 'Network error during processing';
            
          updateToolState(toolId, {
            isProcessing: false,
            processError: errorMessage
          });
          
          if (onComplete) {
            onComplete(null, errorMessage);
          }
        }
      }
    }, 3000); // Poll every 3 seconds

    // Store interval ID for cleanup
    updateToolState(toolId, { pollingIntervalId: pollInterval });
  }, [updateToolState, markUploadAsProcessed]);

  const stopLightingPolling = useCallback((toolId) => {
    const toolState = state[toolId];
    if (toolState?.pollingIntervalId) {
      clearInterval(toolState.pollingIntervalId);
      updateToolState(toolId, { 
        pollingIntervalId: null,
        isProcessing: false 
      });
    }
  }, [state, updateToolState]);

  // Edit counter management
  const incrementEditCount = useCallback((toolId) => {
    const toolState = state[toolId];
    if (!toolState) return;
    
    const newEditCount = (toolState.editCount || 0) + 1;
    updateToolState(toolId, { editCount: newEditCount });
    const maxEdits = toolId === 'lighting' ? 3 : 3;
    console.log(`📊 [EDIT_COUNTER] Incremented edit count for ${toolId}: ${newEditCount}/${maxEdits}`);
  }, [state, updateToolState]);

  const resetEditCount = useCallback((toolId) => {
    const toolState = state[toolId];
    updateToolState(toolId, { 
      editCount: 0, 
      uploadCounted: false,
      // Clear session and history for new image
      currentSession: null,
      editSessions: [],
      history: [],
      historyIndex: -1,
      editHotspots: [],
      hotspotCounter: 1,
      // Preserve session limits
      maxHotspotsPerSession: toolState?.maxHotspotsPerSession || 2,
      maxHotspotsPerEditPhase: toolState?.maxHotspotsPerEditPhase || 2,
      maxTotalHotspotsPerSession: toolState?.maxTotalHotspotsPerSession || 6,
      maxSessions: toolState?.maxSessions || 3
    });
    console.log(`📊 [EDIT_COUNTER] Reset edit count and session for ${toolId}`);
  }, [state, updateToolState]);

  const getEditCount = useCallback((toolId) => {
    const toolState = state[toolId];
    return toolState?.editCount || 0;
  }, [state]);

  const decrementEditCount = useCallback((toolId) => {
    const toolState = state[toolId];
    const currentEditCount = toolState?.editCount || 0;
    const newEditCount = Math.max(0, currentEditCount - 1);
    
    updateToolState(toolId, { editCount: newEditCount });
    console.log(`📊 [EDIT_COUNTER] Decremented edit count for ${toolId}: ${currentEditCount} → ${newEditCount}`);
  }, [state, updateToolState]);

  const canEdit = useCallback((toolId) => {
    const toolState = state[toolId];
    const editCount = toolState?.editCount || 0;
    // Updated: general-edit now allows 3 edits (same as lighting)
    const maxEdits = toolId === 'lighting' ? 3 : 3;
    const canEditResult = editCount < maxEdits;
    // console.log(`🔍 [CAN_EDIT] Tool: ${toolId}, Edit count: ${editCount}, Max: ${maxEdits}, Can edit: ${canEditResult}`);
    return canEditResult;
  }, [state]);

  // Phase 1: Edit session management functions
  const createEditSession = useCallback((toolId) => {
    const toolState = state[toolId];
    if (!toolState) return null;
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession = {
      id: sessionId,
      hotspots: [],
      currentEditPhaseHotspots: [], // Hotspots for current edit phase (max 2)
      totalHotspots: [], // All hotspots in session (max 6)
      result: null,
      timestamp: Date.now(),
      status: 'active' // active, completed, reverted
    };
    
    updateToolState(toolId, {
      currentSession: sessionId,
      editSessions: [...(toolState.editSessions || []), newSession]
    });
    
    console.log(`📝 [EDIT_SESSION] Created new session for ${toolId}: ${sessionId}`);
    return sessionId;
  }, [state, updateToolState]);

  const removeHotspotFromSession = useCallback((toolId, hotspotId) => {
    const toolState = state[toolId];
    if (!toolState || !toolState.currentSession) {
      console.log(`⚠️ [EDIT_SESSION] No session to remove hotspot from`);
      return false;
    }
    
    const currentSessionId = toolState.currentSession;
    const editSessions = toolState.editSessions || [];
    const currentSession = editSessions.find(s => s.id === currentSessionId);
    
    if (!currentSession) {
      console.log(`⚠️ [EDIT_SESSION] Current session not found`);
      return false;
    }
    
    // Remove hotspot from all session arrays
    const updatedHotspots = (currentSession.hotspots || []).filter(h => h.id !== hotspotId);
    const updatedCurrentPhaseHotspots = (currentSession.currentEditPhaseHotspots || []).filter(h => h.id !== hotspotId);
    const updatedTotalHotspots = (currentSession.totalHotspots || []).filter(h => h.id !== hotspotId);
    
    // Update session with removed hotspot
    const updatedSessions = editSessions.map(session => 
      session.id === currentSessionId 
        ? { 
            ...session, 
            hotspots: updatedHotspots,
            currentEditPhaseHotspots: updatedCurrentPhaseHotspots,
            totalHotspots: updatedTotalHotspots
          }
        : session
    );
    
    updateToolState(toolId, { editSessions: updatedSessions });
    console.log(`🗑️ [EDIT_SESSION] Removed hotspot ${hotspotId} from session ${currentSessionId}`);
    return true;
  }, [state, updateToolState]);

  const addHotspotToSession = useCallback((toolId, hotspot) => {
    const toolState = state[toolId];
    console.log(`🔍 [DEBUG] addHotspotToSession called:`, { 
      toolId, 
      hasToolState: !!toolState, 
      currentSession: toolState?.currentSession,
      editSessions: toolState?.editSessions?.length || 0,
      maxHotspotsPerSession: toolState?.maxHotspotsPerSession
    });
    
    if (!toolState || !toolState.currentSession) {
      console.log(`❌ [DEBUG] No toolState or currentSession - should create new session`);
      return false;
    }
    
    const currentSessionId = toolState.currentSession;
    const editSessions = toolState.editSessions || [];
    const currentSession = editSessions.find(s => s.id === currentSessionId);
    
    console.log(`🔍 [DEBUG] Session lookup:`, { 
      currentSessionId, 
      editSessionsCount: editSessions.length,
      foundSession: !!currentSession,
      sessionHotspots: currentSession?.hotspots?.length || 0,
      sessionStatus: currentSession?.status,
      maxHotspotsPerSession: toolState.maxHotspotsPerSession
    });
    
    if (!currentSession) {
      console.log(`❌ [DEBUG] Current session not found in editSessions`);
      return false;
    }
    
    // Check if session is completed - if so, we should create a new session instead
    if (currentSession.status === 'completed') {
      console.log(`🔄 [DEBUG] Current session is completed, should create new session instead`);
      return false;
    }
    
    // Check hotspot limits: 2 per edit phase, 6 total per session
    const maxHotspotsPerPhase = toolState.maxHotspotsPerEditPhase || 2;
    const maxTotalHotspots = toolState.maxTotalHotspotsPerSession || 6;
    const currentEditPhaseHotspots = currentSession.currentEditPhaseHotspots?.length || 0;
    const totalSessionHotspots = currentSession.totalHotspots?.length || 0;
    
    console.log(`🔍 [DEBUG] Hotspot limit check:`, {
      currentEditPhaseHotspots,
      totalSessionHotspots,
      maxHotspotsPerPhase,
      maxTotalHotspots,
      sessionId: currentSessionId,
      sessionCurrentEditPhaseHotspots: currentSession.currentEditPhaseHotspots,
      sessionTotalHotspots: currentSession.totalHotspots
    });
    
    // Check if current edit phase is full (2 hotspots)
    if (currentEditPhaseHotspots >= maxHotspotsPerPhase) {
      console.log(`⚠️ [EDIT_SESSION] Edit phase limit reached for session ${currentSessionId} (${currentEditPhaseHotspots}/${maxHotspotsPerPhase})`);
      return false;
    }
    
    // Check if total session is full (6 hotspots)
    if (totalSessionHotspots >= maxTotalHotspots) {
      console.log(`⚠️ [EDIT_SESSION] Total session limit reached for session ${currentSessionId} (${totalSessionHotspots}/${maxTotalHotspots})`);
      return false;
    }
    
    const updatedSessions = editSessions.map(session => 
      session.id === currentSessionId 
        ? { 
            ...session, 
            hotspots: [...session.hotspots, hotspot],
            currentEditPhaseHotspots: [...(session.currentEditPhaseHotspots || []), hotspot],
            totalHotspots: [...(session.totalHotspots || []), hotspot]
          }
        : session
    );
    
    updateToolState(toolId, { editSessions: updatedSessions });
    console.log(`🎯 [EDIT_SESSION] Added hotspot to session ${currentSessionId} (${currentEditPhaseHotspots + 1}/${maxHotspotsPerPhase} phase, ${totalSessionHotspots + 1}/${maxTotalHotspots} total)`);
    return true;
  }, [state, updateToolState]);

  // Combined function to create session and add hotspot in one operation
  const createSessionAndAddHotspot = useCallback((toolId, hotspot) => {
    const toolState = state[toolId];
    if (!toolState) return false;
    
    console.log(`🔍 [DEBUG] createSessionAndAddHotspot called:`, {
      toolId,
      hasCurrentSession: !!toolState.currentSession,
      editSessionsCount: toolState.editSessions?.length || 0,
      maxHotspotsPerSession: toolState.maxHotspotsPerSession,
      currentSessionId: toolState.currentSession
    });
    
    // Check if we already have a current session
    if (toolState.currentSession) {
      const currentSession = toolState.editSessions?.find(s => s.id === toolState.currentSession);
      console.log(`🔍 [DEBUG] Current session status:`, {
        sessionId: toolState.currentSession,
        status: currentSession?.status,
        hotspots: currentSession?.hotspots?.length || 0
      });
      
      // If session is completed, create a new one instead
      if (currentSession?.status === 'completed') {
        console.log(`🔄 [DEBUG] Current session is completed, creating new session`);
        // Fall through to create new session
      } else {
        // Use existing active session (sessions should persist until new upload)
        const result = addHotspotToSession(toolId, hotspot);
        if (result) return true;
        // If addHotspotToSession failed (e.g., limits reached), return false
        console.log(`⚠️ [DEBUG] Failed to add hotspot to existing session`);
        return false;
      }
    }
    
    // No current session, create new one
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession = {
      id: sessionId,
      hotspots: [hotspot],
      currentEditPhaseHotspots: [hotspot], // Hotspots for current edit phase (max 2)
      totalHotspots: [hotspot], // All hotspots in session (max 6)
      result: null,
      timestamp: Date.now(),
      status: 'active'
    };
    
    updateToolState(toolId, {
      currentSession: sessionId,
      editSessions: [...(toolState.editSessions || []), newSession]
    });
    
    console.log(`📝 [EDIT_SESSION] Created new session with hotspot for ${toolId}: ${sessionId}`);
    return true;
  }, [state, updateToolState, addHotspotToSession]);

  const completeEditSession = useCallback((toolId, result) => {
    const toolState = state[toolId];
    if (!toolState || !toolState.currentSession) return false;
    
    const currentSessionId = toolState.currentSession;
    const editSessions = toolState.editSessions || [];
    
    console.log(`🔍 [DEBUG] completeEditSession called:`, {
      toolId,
      currentSessionId,
      editSessionsCount: editSessions.length,
      result: !!result,
      currentHotspots: toolState.editHotspots?.length || 0,
      maxHotspotsPerSession: toolState.maxHotspotsPerSession
    });
    
    // Add result to history for revert functionality
    const currentHistory = toolState.history || [];
    const newHistory = [...currentHistory, {
      id: `edit_${Date.now()}`,
      imageUrl: result,
      originalImageUrl: toolState.processingImageUrl, // Store standardized image for hold to compare
      timestamp: Date.now(),
      sessionId: currentSessionId
    }];
    
    // Update session with result but keep it active for more edits
    const updatedSessions = editSessions.map(session => 
      session.id === currentSessionId 
        ? { ...session, result, lastEditAt: Date.now() }
        : session
    );
    
    // Reset only the current edit phase hotspots for the next edit, keep total session hotspots
    const resetSessions = updatedSessions.map(session => 
      session.id === currentSessionId 
        ? { 
            ...session, 
            hotspots: [], // Clear UI hotspots
            currentEditPhaseHotspots: [], // Reset current edit phase (allow 2 more)
            status: 'active' // Keep session active
          }
        : session
    );
    
    console.log(`🔄 [DEBUG] Session reset:`, {
      sessionId: currentSessionId,
      beforeReset: updatedSessions.find(s => s.id === currentSessionId)?.currentEditPhaseHotspots?.length || 0,
      afterReset: resetSessions.find(s => s.id === currentSessionId)?.currentEditPhaseHotspots?.length || 0,
      totalHotspots: resetSessions.find(s => s.id === currentSessionId)?.totalHotspots?.length || 0
    });
    
    updateToolState(toolId, { 
      editSessions: resetSessions,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      // Keep currentSession active for more edits but clear hotspots
      processedSrc: result,
      showEnhanced: true,
      editHotspots: [], // Clear hotspots after each edit
      hotspotCounter: 1 // Reset hotspot counter
    });
    
    console.log(`✅ [EDIT_SESSION] Added result to history and kept session active for more edits`);
    console.log(`🔍 [DEBUG] Session state after completion:`, {
      currentSession: toolState.currentSession,
      editHotspots: [],
      hotspotCounter: 1,
      historyLength: newHistory.length
    });
    return true;
  }, [state, updateToolState]);

  const revertToSession = useCallback((toolId, sessionId) => {
    const toolState = state[toolId];
    if (!toolState) return false;
    
    const editSessions = toolState.editSessions || [];
    const targetSession = editSessions.find(s => s.id === sessionId);
    
    if (!targetSession || !targetSession.result) return false;
    
    // Revert to the result of the target session
    updateToolState(toolId, {
      processedSrc: targetSession.result,
      showEnhanced: true,
      currentSession: null,
      editHotspots: [] // Clear current hotspots
    });
    
    console.log(`🔄 [EDIT_SESSION] Reverted to session ${sessionId}`);
    return true;
  }, [state, updateToolState]);

  // Revert to a specific history entry
  const revertToHistory = useCallback((toolId, historyIndex) => {
    const toolState = state[toolId];
    if (!toolState) return false;
    
    const history = toolState.history || [];
    const targetEntry = history[historyIndex];
    
    if (!targetEntry) return false;
    
    // Ensure we always have the standardized image for hold to compare
    // Priority: targetEntry.originalImageUrl > toolState.processingImageUrl > toolState.originalSrc
    const standardizedImage = targetEntry.originalImageUrl || 
                             toolState.processingImageUrl || 
                             toolState.originalSrc;
    
    console.log(`🔍 [HISTORY] Reverting with standardized image:`, {
      targetEntryOriginalImageUrl: targetEntry.originalImageUrl,
      toolStateProcessingImageUrl: toolState.processingImageUrl,
      toolStateOriginalSrc: toolState.originalSrc,
      finalStandardizedImage: standardizedImage
    });
    
    // Reset the current session's hotspots when going back
    const editSessions = toolState.editSessions || [];
    const currentSessionId = toolState.currentSession;
    const resetSessions = editSessions.map(session => 
      session.id === currentSessionId 
        ? { ...session, hotspots: [], status: 'active' } // Reset hotspots for new edit
        : session
    );
    
    // Revert to the history entry with standardized image for hold to compare
    updateToolState(toolId, {
      originalSrc: standardizedImage, // Always use standardized image for hold to compare
      processedSrc: targetEntry.imageUrl,
      upscaledImage: null, // Remove upscaled version
      showEnhanced: true,
      historyIndex: historyIndex,
      editHotspots: [], // Clear current hotspots
      editSessions: resetSessions // Reset session hotspots
    });
    
    console.log(`🔄 [HISTORY] Reverted to history entry ${historyIndex}: ${targetEntry.imageUrl}`);
    return true;
  }, [state, updateToolState]);

  const getCurrentSession = useCallback((toolId) => {
    const toolState = state[toolId];
    if (!toolState || !toolState.currentSession) return null;
    
    const editSessions = toolState.editSessions || [];
    return editSessions.find(s => s.id === toolState.currentSession);
  }, [state]);

  const canAddHotspot = useCallback((toolId) => {
    const toolState = state[toolId];
    if (!toolState) return false;
    
    const currentSession = getCurrentSession(toolId);
    if (!currentSession) return false;
    
    const maxHotspots = toolState.maxHotspotsPerSession || 2;
    return currentSession.hotspots.length < maxHotspots;
  }, [state, getCurrentSession]);

  // Start new session when new image is uploaded
  const startNewSession = useCallback((toolId) => {
    const toolState = state[toolId];
    if (!toolState) return false;
    
    console.log(`🔄 [DEBUG] Starting new session for new image upload`);
    
    // Clear current session and history for new image
    updateToolState(toolId, {
      currentSession: null,
      editSessions: [],
      history: [],
      historyIndex: -1,
      editHotspots: [],
      hotspotCounter: 1,
      editCount: 0,
      // Reset session limits for new image
      maxHotspotsPerEditPhase: 2,
      maxTotalHotspotsPerSession: 6
    });
    
    console.log(`✅ [EDIT_SESSION] Cleared session and history for new image`);
    return true;
  }, [state, updateToolState]);

  const contextValue = useMemo(() => ({
    state,
    updateToolState,
    resetToolState,
    updateLastActivity,
    cleanupOldStates,
    getToolState,
    hasActiveWork,
    getActiveTools,
    getPerformanceMetrics,
    markUploadAsProcessed,
    startLightingPolling,
    stopLightingPolling,
    refreshUploadStats,
    getUploadStats,
    getUploadStatsLoading,
    getUploadStatsError,
    updateToolBackgroundState,
    getToolBackgroundState,
    shouldShowBlackBackground,
    incrementEditCount,
    decrementEditCount,
    resetEditCount,
    getEditCount,
    canEdit,
    // Phase 1: Edit session management
    createEditSession,
    addHotspotToSession,
    removeHotspotFromSession,
    createSessionAndAddHotspot,
    completeEditSession,
    revertToSession,
    revertToHistory,
    getCurrentSession,
    canAddHotspot,
    startNewSession
  }), [
    state,
    updateToolState,
    resetToolState,
    updateLastActivity,
    cleanupOldStates,
    getToolState,
    hasActiveWork,
    getActiveTools,
    getPerformanceMetrics,
    markUploadAsProcessed,
    startLightingPolling,
    stopLightingPolling,
    refreshUploadStats,
    getUploadStats,
    getUploadStatsLoading,
    getUploadStatsError,
    updateToolBackgroundState,
    getToolBackgroundState,
    shouldShowBlackBackground,
    incrementEditCount,
    decrementEditCount,
    resetEditCount,
    getEditCount,
    canEdit,
    // Phase 1: Edit session management
    createEditSession,
    addHotspotToSession,
    removeHotspotFromSession,
    createSessionAndAddHotspot,
    completeEditSession,
    revertToSession,
    revertToHistory,
    getCurrentSession,
    canAddHotspot,
    startNewSession
  ]);

  // Auto-refresh upload stats on tool switches and page reloads
  React.useEffect(() => {
    // Initial refresh when component mounts
    refreshUploadStats();
    
    // Background state is now managed individually by each tool
    
    // Register with refresh service
    RefreshService.registerRefreshCallback(refreshUploadStats);
    
    // Listen for tool state changes (tool switches)
    const handleToolStateChange = () => {
      // Debounce refresh to avoid excessive API calls
      setTimeout(() => {
        refreshUploadStats();
      }, 500);
    };
    
    // On return from Stripe (payment=success), force refresh
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('payment') === 'success') {
        refreshUploadStats();
        // Clean up the URL param without reloading
        url.searchParams.delete('payment');
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }
    } catch {}

    // Listen for page visibility changes (page reloads)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshUploadStats();
      }
    };
    
    // Listen for window focus (user returns to tab)
    const handleWindowFocus = () => {
      refreshUploadStats();
    };
    
    // Listen for auth state changes (sign in/out)
    const handleAuthStateChange = () => {
      // console.log('🔄 [TOOL_STATE_MANAGER] Auth state changed, refreshing upload stats...');
      // Immediate refresh when auth state changes
      refreshUploadStats();
    };
    
    // Add event listeners
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('authStateChanged', handleAuthStateChange);
    
    // Listen for custom upload completion events
    const handleUploadComplete = () => {
      setTimeout(() => {
        refreshUploadStats();
      }, 1000); // Small delay to ensure backend has processed
    };
    
    window.addEventListener('uploadCompleted', handleUploadComplete);
    window.addEventListener('uploadProcessed', handleUploadComplete);
    
    return () => {
      // Unregister from refresh service
      RefreshService.unregisterRefreshCallback(refreshUploadStats);
      
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('authStateChanged', handleAuthStateChange);
      window.removeEventListener('uploadCompleted', handleUploadComplete);
      window.removeEventListener('uploadProcessed', handleUploadComplete);
    };
  }, [refreshUploadStats]);

  // Background state is now managed individually by each tool

  // Periodic cleanup (every 5 minutes)
  React.useEffect(() => {
    const interval = setInterval(cleanupOldStates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cleanupOldStates]);

  return (
    <ToolStateContext.Provider value={contextValue}>
      {children}
    </ToolStateContext.Provider>
  );
}

// Hook for using the tool state
export function useToolState(toolId) {
  const context = useContext(ToolStateContext);
  if (!context) {
    throw new Error('useToolState must be used within a ToolStateProvider');
  }

  const toolState = useMemo(() => {
    const currentToolState = context.state[toolId] || createInitialToolState();
    
    const safeToolState = {
      ...createInitialToolState(),
      ...currentToolState,
      editHotspots: Array.isArray(currentToolState.editHotspots) ? currentToolState.editHotspots : [],
      history: Array.isArray(currentToolState.history) ? currentToolState.history : [],
      historyIndex: typeof currentToolState.historyIndex === 'number' ? currentToolState.historyIndex : -1,
      customPrompt: typeof currentToolState.customPrompt === 'string' ? currentToolState.customPrompt : '',
      lastEditPrompt: typeof currentToolState.lastEditPrompt === 'string' ? currentToolState.lastEditPrompt : null,
      activeTab: typeof currentToolState.activeTab === 'string' ? currentToolState.activeTab : 'retouch',
      containerDims: currentToolState.containerDims && typeof currentToolState.containerDims === 'object' && currentToolState.containerDims.width && currentToolState.containerDims.height ? currentToolState.containerDims : { width: '500px', height: '300px' },
      stableContainerDims: currentToolState.stableContainerDims && typeof currentToolState.stableContainerDims === 'object' && currentToolState.stableContainerDims.width && currentToolState.stableContainerDims.height ? currentToolState.stableContainerDims : { width: '500px', height: '300px' },
      lightingOptions: currentToolState.lightingOptions && typeof currentToolState.lightingOptions === 'object' ? currentToolState.lightingOptions : {},
      imageCaption: typeof currentToolState.imageCaption === 'string' ? currentToolState.imageCaption : null,
      isCaptionPending: !!currentToolState.isCaptionPending,
      editCount: typeof currentToolState.editCount === 'number' ? currentToolState.editCount : 0,
      uploadCounted: !!currentToolState.uploadCounted,
      // Phase 1: Edit session management
      editSessions: Array.isArray(currentToolState.editSessions) ? currentToolState.editSessions : [],
      currentSession: typeof currentToolState.currentSession === 'string' ? currentToolState.currentSession : null,
      maxSessions: typeof currentToolState.maxSessions === 'number' ? currentToolState.maxSessions : 3,
      maxHotspotsPerSession: typeof currentToolState.maxHotspotsPerSession === 'number' ? currentToolState.maxHotspotsPerSession : 2,
      maxHotspotsPerEditPhase: typeof currentToolState.maxHotspotsPerEditPhase === 'number' ? currentToolState.maxHotspotsPerEditPhase : 2,
      maxTotalHotspotsPerSession: typeof currentToolState.maxTotalHotspotsPerSession === 'number' ? currentToolState.maxTotalHotspotsPerSession : 6
    };
    
    return {
      ...safeToolState,
      hasImage: !!safeToolState.originalSrc,
      hasProcessedImage: !!safeToolState.processedSrc,
      hasUpscaledImage: !!safeToolState.upscaledImage
    };
  }, [toolId, context.state, context.hasActiveWork]);
  
  const updateState = useCallback((updates) => {
    context.updateToolState(toolId, updates);
  }, [context.updateToolState, toolId]);

  const resetState = useCallback(() => {
    context.resetToolState(toolId);
  }, [context.resetToolState, toolId]);

  const updateActivity = useCallback(() => {
    context.updateLastActivity(toolId);
  }, [context.updateLastActivity, toolId]);

  const markUploadAsProcessed = useCallback(async (predictionId = null) => {
    return await context.markUploadAsProcessed(toolId, predictionId);
  }, [context.markUploadAsProcessed, toolId]);

  const startLightingPolling = useCallback(async (predictionId, onComplete = null) => {
    return await context.startLightingPolling(toolId, predictionId, onComplete);
  }, [context.startLightingPolling, toolId]);

  const stopLightingPolling = useCallback(() => {
    return context.stopLightingPolling(toolId);
  }, [context.stopLightingPolling, toolId]);

  return {
    ...toolState,
    updateState,
    resetState,
    updateActivity,
    markUploadAsProcessed,
    startLightingPolling,
    stopLightingPolling,
    hasActiveWork: context.hasActiveWork(toolId),
    performanceMetrics: context.getPerformanceMetrics(),
    incrementEditCount: context.incrementEditCount,
    decrementEditCount: context.decrementEditCount,
    resetEditCount: context.resetEditCount,
    getEditCount: context.getEditCount,
    canEdit: context.canEdit,
    // Phase 1: Edit session management
    createEditSession: context.createEditSession,
    addHotspotToSession: context.addHotspotToSession,
    removeHotspotFromSession: context.removeHotspotFromSession,
    createSessionAndAddHotspot: context.createSessionAndAddHotspot,
    completeEditSession: context.completeEditSession,
    revertToSession: context.revertToSession,
    revertToHistory: context.revertToHistory,
    getCurrentSession: context.getCurrentSession,
    canAddHotspot: context.canAddHotspot,
    startNewSession: context.startNewSession
  };
}

// Hook for tool state management
export function useToolStateManager() {
  const context = useContext(ToolStateContext);
  if (!context) {
    throw new Error('useToolStateManager must be used within a ToolStateProvider');
  }
  
  
  return context;
}