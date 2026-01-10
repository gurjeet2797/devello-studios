import React, { forwardRef, useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import ImageOverlay from '../../ImageOverlay';
import Loader from '../../loader';
import ActionButtons from './ActionButtons';
import { Button } from '../../ui/Button';
import { useRouter } from 'next/router';
import GlassSurface from '../../GlassSurface';
import { useToolStateManager } from '../../contexts/ToolStateManager';
import { RESET_HOME_BUTTON_STYLE, RESET_HOME_BUTTON_CLASS } from '../../ui/buttonStyles';
import { canAddHotspot as canAddHotspotFromLimits } from '../../../lib/editLimits';
import { useTheme } from '../../Layout';
import ReferenceUploader from './ReferenceUploader';
import CodeInputModal from '../../CodeInputModal';

const ImageContainer = forwardRef(({
  originalSrc,
  processedSrc,
  showEnhanced,
  isProcessing,
  isUpscaling,
  isPreparingPreview,
  isUploading,
  editHotspots,
  hotspotCounter,
  activeTab,
  imageReady,
  containerDims,
  stableContainerDims,
  isMobile,
  processError,
  upscaleError,
  updateState,
  fileInputRef,
  onShowPaymentModal,
  onShowBillingModal,
  onDirectPayment,
  onShowAuthModal,
  user,
  userData,
  setUserData,
  uploadId,
  userProfile,
  markUploadAsProcessed,
  refreshAfterUpload,
  originalImageForComparison,
  upscaledImage,
  processingImageUrl,
  history,
  historyIndex,
  canUndo,
  canRedo,
  processRetouch,
  editCount,
  decrementEditCount,
  // Phase 1: Edit session management
  editSessions,
  currentSession,
  maxSessions,
  maxHotspotsPerSession,
  createEditSession,
  addHotspotToSession,
  removeHotspotFromSession,
  createSessionAndAddHotspot,
  completeEditSession,
  revertToSession,
  revertToHistory,
  getCurrentSession,
  canAddHotspot,
}, ref) => {
  const { isDark } = useTheme();
  const [showCodeModal, setShowCodeModal] = useState(false);
  
  // Client-side mobile detection to prevent hydration issues
  const [isClientMobile, setIsClientMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsClientMobile(window.innerWidth < 640);
      }
    };
    
    checkMobile(); // Initial check
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);
  const router = useRouter();
  const toolStateManager = useToolStateManager();
  
  // Get customPrompt from tool state for filename generation
  const customPrompt = toolStateManager?.getToolState?.('general-edit')?.customPrompt || '';
  
  // Get upload stats from ToolStateManager
  const uploadStats = toolStateManager?.getUploadStats?.() || null;
  const remainingUploads = uploadStats?.remaining || 0;
  const planType = uploadStats?.planType || 'free';

  // Cache upload state in localStorage for immediate display
  const [cachedUploadState, setCachedUploadState] = useState(null);

  // Cache subscription status for immediate button text display
  const [cachedSubscriptionStatus, setCachedSubscriptionStatus] = useState(null);

  // Load cached data after component mounts (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uploadCached = localStorage.getItem('devello_upload_state');
      const subscriptionCached = localStorage.getItem('devello_subscription_status');
      
      if (uploadCached) {
        setCachedUploadState(JSON.parse(uploadCached));
      }
      if (subscriptionCached) {
        setCachedSubscriptionStatus(JSON.parse(subscriptionCached));
      }
    }
  }, []);

  // Update cache when upload stats change
  useEffect(() => {
    if (uploadStats && typeof window !== 'undefined') {
      const stateToCache = {
        remaining: uploadStats.remaining,
        planType: uploadStats.planType,
        timestamp: Date.now()
      };
      localStorage.setItem('devello_upload_state', JSON.stringify(stateToCache));
      setCachedUploadState(stateToCache);
    }
  }, [uploadStats]);

  // Update cache when subscription status changes
  useEffect(() => {
    if (userData?.subscription && typeof window !== 'undefined') {
      const statusToCache = {
        status: userData.subscription.status,
        planType: userData.subscription.plan_type,
        timestamp: Date.now()
      };
      localStorage.setItem('devello_subscription_status', JSON.stringify(statusToCache));
      setCachedSubscriptionStatus(statusToCache);
    }
  }, [userData?.subscription]);

  // Use cached state if available and recent (within 5 minutes), otherwise use live data
  const displayRemainingUploads = (() => {
    if (cachedUploadState && Date.now() - cachedUploadState.timestamp < 5 * 60 * 1000) {
      return cachedUploadState.remaining;
    }
    return remainingUploads;
  })();
  
  // Check if user is admin (unlimited uploads)
  const isAdmin = displayRemainingUploads === Infinity || uploadStats?.planType === 'admin' || uploadStats?.uploadLimit === Infinity;

  // Determine button text using cached subscription status
  const getButtonText = () => {
    // Use cached subscription status if available and recent
    if (cachedSubscriptionStatus && Date.now() - cachedSubscriptionStatus.timestamp < 5 * 60 * 1000) {
      const hasActiveSubscription = cachedSubscriptionStatus.status === 'active' || cachedSubscriptionStatus.status === 'canceled';
      return hasActiveSubscription ? 'Manage Subscription' : 'Subscribe Now';
    }
    
    // Fallback to live data
    if (userData?.subscription) {
      const hasActiveSubscription = userData.subscription.status === 'active' || userData.subscription.status === 'canceled';
      return hasActiveSubscription ? 'Manage Subscription' : 'Subscribe Now';
    }
    
    // Default to Subscribe Now if no subscription data
    return 'Subscribe Now';
  };

  // Determine message text based on subscription status
  const getMessageText = () => {
    // Use cached subscription status if available and recent
    if (cachedSubscriptionStatus && Date.now() - cachedSubscriptionStatus.timestamp < 5 * 60 * 1000) {
      const hasActiveSubscription = cachedSubscriptionStatus.status === 'active' || cachedSubscriptionStatus.status === 'canceled';
      return hasActiveSubscription ? 'Please upgrade or request for more sessions' : 'Subscribe to get up to 60 sessions per month';
    }
    
    // Fallback to live data
    if (userData?.subscription) {
      const hasActiveSubscription = userData.subscription.status === 'active' || userData.subscription.status === 'canceled';
      return hasActiveSubscription ? 'Please upgrade or request for more sessions' : 'Subscribe to get up to 60 sessions per month';
    }
    
    // Default message for free users
    return 'Subscribe to get up to 60 sessions per month';
  };
  
  // Global drag state to prevent new hotspots during/after drag
  const [isDraggingHotspot, setIsDraggingHotspot] = useState(false);
  
  // State for managing hotspot container visibility
  const [visibleContainers, setVisibleContainers] = useState(new Set());
  const [persistentContainers, setPersistentContainers] = useState(new Set());
  const [focusedTextboxes, setFocusedTextboxes] = useState(new Set());
  const [latestHotspotId, setLatestHotspotId] = useState(null);
  const hoverTimeoutRef = useRef({});
  
  // State for dynamic background color detection
  const [hotspotColors, setHotspotColors] = useState({});
  
  // State to control when child elements can render (after container expansion)
  const [containerExpanded, setContainerExpanded] = useState(false);
  
  // Set containerExpanded to true after container animation completes
  useEffect(() => {
    if (originalSrc && !containerExpanded) {
      const timer = setTimeout(() => {
        setContainerExpanded(true);
      }, 800); // Match container animation duration
      
      return () => clearTimeout(timer);
    } else if (!originalSrc) {
      setContainerExpanded(false);
    }
  }, [originalSrc, containerExpanded]);
  

  // Phase 2: Optimized background color detection with caching and debouncing
  const colorDetectionCache = useRef(new Map());
  const colorDetectionTimeout = useRef(null);
  
  const detectBackgroundColor = useCallback((hotspot, imageElement) => {
    if (!imageElement || !hotspot) return null;
    
    // Check if image is cross-origin (common cause of CORS issues)
    try {
      // Test if we can access the image's natural dimensions without CORS issues
      const testCanvas = document.createElement('canvas');
      const testCtx = testCanvas.getContext('2d');
      testCanvas.width = 1;
      testCanvas.height = 1;
      testCtx.drawImage(imageElement, 0, 0, 1, 1);
      testCtx.getImageData(0, 0, 1, 1); // This will throw if cross-origin
    } catch (corsError) {
      console.warn('Image is cross-origin, using fallback colors:', corsError);
      // Return fallback colors immediately for cross-origin images
      return {
        r: 128, g: 128, b: 128, brightness: 128, isLight: true,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderColor: 'rgba(0, 0, 0, 0.8)',
        textColor: 'rgba(255, 255, 255, 0.95)',
        textShadow: '0 1px 3px rgba(0,0,0,0.8)'
      };
    }
    
    // Phase 2: Create cache key for this hotspot position
    const cacheKey = `${hotspot.x}-${hotspot.y}-${imageElement.src}`;
    
    // Check cache first
    if (colorDetectionCache.current.has(cacheKey)) {
      return colorDetectionCache.current.get(cacheKey);
    }
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Phase 2: Optimize canvas size - use smaller canvas for faster processing
      const maxCanvasSize = 1024; // Limit canvas size for performance
      const aspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
      let canvasWidth, canvasHeight;
      
      if (imageElement.naturalWidth > imageElement.naturalHeight) {
        canvasWidth = Math.min(maxCanvasSize, imageElement.naturalWidth);
        canvasHeight = canvasWidth / aspectRatio;
      } else {
        canvasHeight = Math.min(maxCanvasSize, imageElement.naturalHeight);
        canvasWidth = canvasHeight * aspectRatio;
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Phase 2: Use faster image drawing with quality settings
      ctx.imageSmoothingEnabled = false; // Faster rendering
      
      // Check if image is cross-origin before drawing
      try {
        ctx.drawImage(imageElement, 0, 0, canvasWidth, canvasHeight);
      } catch (drawError) {
        console.warn('Cannot draw cross-origin image for color detection:', drawError);
        // Return fallback colors immediately for cross-origin images
        return {
          r: 128, g: 128, b: 128, brightness: 128, isLight: true,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderColor: 'rgba(0, 0, 0, 0.8)',
          textColor: 'rgba(255, 255, 255, 0.95)',
          textShadow: '0 1px 3px rgba(0,0,0,0.8)'
        };
      }
      
      // Calculate pixel position from percentage (scaled to canvas size)
      const x = Math.floor((hotspot.x / 100) * canvasWidth);
      const y = Math.floor((hotspot.y / 100) * canvasHeight);
      
      // Phase 2: Sample multiple pixels for better accuracy
      const sampleSize = 3;
      const halfSample = Math.floor(sampleSize / 2);
      let totalR = 0, totalG = 0, totalB = 0, pixelCount = 0;
      
      for (let dy = -halfSample; dy <= halfSample; dy++) {
        for (let dx = -halfSample; dx <= halfSample; dx++) {
          const sampleX = Math.max(0, Math.min(canvasWidth - 1, x + dx));
          const sampleY = Math.max(0, Math.min(canvasHeight - 1, y + dy));
          
          const imageData = ctx.getImageData(sampleX, sampleY, 1, 1);
          const [r, g, b] = imageData.data;
          totalR += r;
          totalG += g;
          totalB += b;
          pixelCount++;
        }
      }
      
      // Calculate average color
      const avgR = Math.floor(totalR / pixelCount);
      const avgG = Math.floor(totalG / pixelCount);
      const avgB = Math.floor(totalB / pixelCount);
      
      // Phase 2: Enhanced brightness calculation with better contrast detection
      const brightness = (avgR * 0.299 + avgG * 0.587 + avgB * 0.114);
      const saturation = Math.max(avgR, avgG, avgB) - Math.min(avgR, avgG, avgB);
      
      // Phase 2: More sophisticated background detection
      const isLight = brightness > 140; // Slightly higher threshold for better contrast
      const isHighContrast = saturation > 50;
      
      const result = {
        r: avgR, g: avgG, b: avgB, brightness, isLight, isHighContrast,
        // Phase 2: Enhanced color schemes for better visibility
        backgroundColor: isLight 
          ? `rgba(0, 0, 0, ${isHighContrast ? '0.8' : '0.7'})` // Darker for high contrast
          : `rgba(255, 255, 255, ${isHighContrast ? '0.4' : '0.3'})`, // Lighter for high contrast
        borderColor: isLight 
          ? `rgba(0, 0, 0, ${isHighContrast ? '0.9' : '0.8'})` 
          : `rgba(255, 255, 255, ${isHighContrast ? '0.6' : '0.5'})`,
        textColor: `rgba(255, 255, 255, 0.95)`,
        // Phase 2: Add shadow for better text readability
        textShadow: isLight ? '0 1px 3px rgba(0,0,0,0.8)' : '0 1px 3px rgba(0,0,0,0.5)'
      };
      
      // Cache the result
      colorDetectionCache.current.set(cacheKey, result);
      
      // Phase 2: Limit cache size to prevent memory leaks
      if (colorDetectionCache.current.size > 50) {
        const firstKey = colorDetectionCache.current.keys().next().value;
        colorDetectionCache.current.delete(firstKey);
      }
      
      return result;
    } catch (error) {
      console.warn('Color detection failed (cross-origin or other error):', error);
      // Return fallback colors when color detection fails
      return {
        r: 128, g: 128, b: 128, brightness: 128, isLight: true,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderColor: 'rgba(0, 0, 0, 0.8)',
        textColor: 'rgba(255, 255, 255, 0.95)' // Always white text
      };
    }
  }, []);

  // Phase 2: Debounced color detection to prevent excessive calculations
  const debouncedColorDetection = useCallback((hotspot, imageElement) => {
    if (colorDetectionTimeout.current) {
      clearTimeout(colorDetectionTimeout.current);
    }
    
    colorDetectionTimeout.current = setTimeout(() => {
      const colorData = detectBackgroundColor(hotspot, imageElement);
      if (colorData) {
        setHotspotColors(prev => ({
          ...prev,
          [hotspot.id]: colorData
        }));
      }
    }, 100); // 100ms debounce
  }, [detectBackgroundColor]);

  // Phase 2: Memoized hotspot rendering for better performance
  const memoizedHotspots = useMemo(() => {
    if (!editHotspots || editHotspots.length === 0) return [];
    
    return editHotspots.map((hotspot, index) => {
      const colorData = hotspotColors[hotspot.id];
      const isVisible = visibleContainers.has(hotspot.id) || persistentContainers.has(hotspot.id);
      const isFocused = focusedTextboxes.has(hotspot.id);
      
      return {
        ...hotspot,
        colorData,
        isVisible,
        isFocused,
        index
      };
    });
  }, [editHotspots, hotspotColors, visibleContainers, persistentContainers, focusedTextboxes]);


  // Debug: Monitor imageReady state changes
  useEffect(() => {
    // console.log('🖼️ [STATE_CHANGE] imageReady changed:', { imageReady, originalSrc: !!originalSrc });
  }, [imageReady, originalSrc]);

  // Debug: Monitor all props changes
  useEffect(() => {
    // console.log('🖼️ [PROPS_CHANGE] ImageContainer props updated:', { 
    //   imageReady, 
    //   originalSrc: !!originalSrc, 
    //   showEnhanced, 
    //   isProcessing,
    //   editHotspots: editHotspots?.length || 0,
    //   currentSession: !!currentSession
    // });
  }, [imageReady, originalSrc, showEnhanced, isProcessing, editHotspots, currentSession]);

  // Auto-focus textarea on mobile when hotspot is created
  useEffect(() => {
    if (isMobile && editHotspots?.length > 0) {
      const latestHotspot = editHotspots[editHotspots.length - 1];
      const textarea = document.getElementById(`hotspot-prompt-${latestHotspot.id}`);
      if (textarea) {
        setTimeout(() => textarea.focus(), 200);
      }
    }
  }, [editHotspots, isMobile]);

  // Simple button contrast - always use dark background with white text
  const getButtonContrastStyle = useCallback(() => ({
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'rgba(255, 255, 255, 1)',
    borderColor: 'rgba(255, 255, 255, 0.3)'
  }), []);

  // Update hotspot colors when hotspots change
  useEffect(() => {
    if (!originalSrc || !editHotspots?.length) return;
    
    const imageElement = document.querySelector('img[alt*="Original Photo"]');
    if (!imageElement) return;
    
    // Wait for image to load
    if (!imageElement.complete || imageElement.naturalWidth === 0) {
      const handleLoad = () => {
        const newColors = {};
        editHotspots.forEach(hotspot => {
          const colorData = detectBackgroundColor(hotspot, imageElement);
          if (colorData) {
            newColors[hotspot.id] = colorData;
          }
        });
        setHotspotColors(newColors);
      };
      
      imageElement.addEventListener('load', handleLoad);
      return () => imageElement.removeEventListener('load', handleLoad);
    }
    
    // Image is already loaded
    const newColors = {};
    editHotspots.forEach(hotspot => {
      const colorData = detectBackgroundColor(hotspot, imageElement);
      if (colorData) {
        newColors[hotspot.id] = colorData;
      }
    });
    setHotspotColors(newColors);
  }, [editHotspots, originalSrc, detectBackgroundColor]);

  
  // Refs to track dragging elements
  const draggingRefs = useRef({});

  // UI Handlers - robust file selection trigger
  const triggerFileSelect = useCallback(() => {
    if (!fileInputRef.current) {
      console.error('❌ [FILE_UPLOAD] File input ref is not available');
      updateState({ processError: 'File upload is not available. Please refresh the page.' });
      return;
    }
    
    // Don't allow upload if already uploading
    if (isUploading) {
      console.log('⚠️ [FILE_UPLOAD] Upload already in progress');
      return;
    }
    
    try {
      // Reset the input to allow selecting the same file again
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    } catch (error) {
      console.error('❌ [FILE_UPLOAD] Error triggering file select:', error);
      updateState({ processError: 'Failed to open file selector. Please try again.' });
    }
  }, [updateState, isUploading]);
  
  // Phase 3: Hotspot validation function
  const validateHotspotPlacement = useCallback((newHotspot, existingHotspots) => {
    // Check if hotspot is too close to edges
    if (newHotspot.x < 2 || newHotspot.x > 98 || newHotspot.y < 2 || newHotspot.y > 98) {
      return {
        isValid: false,
        reason: 'Hotspot too close to image edge. Please place it more centrally.'
      };
    }
    
    // Check if hotspot is too close to existing hotspots
    for (const existing of existingHotspots) {
      const distance = Math.sqrt(
        Math.pow(newHotspot.x - existing.x, 2) + 
        Math.pow(newHotspot.y - existing.y, 2)
      );
      if (distance < 8) {
        return {
          isValid: false,
          reason: 'Hotspot too close to existing hotspot. Please place it further away.'
        };
      }
    }
    
    return { isValid: true };
  }, []);

  // Phase 2: Optimized image click handling with performance improvements
  const handleImageClick = useCallback((event) => {
    console.log('🎯 Image clicked!', { activeTab, originalSrc, showEnhanced, imageReady, isDraggingHotspot });
    console.log('🎯 [DEBUG] Current state:', { 
      activeTab, 
      originalSrc: !!originalSrc, 
      showEnhanced, 
      imageReady, 
      isDraggingHotspot,
      editHotspots: editHotspots?.length || 0,
      currentSession: !!currentSession
    });
    
    // Phase 2: Early return optimizations - check most common conditions first
    if (activeTab !== 'retouch' || !imageReady || !originalSrc || showEnhanced || isDraggingHotspot) {
      console.log('🎯 Click ignored - early return conditions', { activeTab, imageReady, originalSrc, showEnhanced, isDraggingHotspot });
      return;
    }
    
    // Phase 2: Optimized synthetic click detection
    if (event.detail === 0) {
      console.log('🎯 Click ignored - synthetic click from drag operation');
      return;
    }
    
    // Check if the click target is an input, button, or any interactive element
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON' || 
        target.tagName === 'SELECT' || target.tagName === 'LABEL' ||
        target.closest('input') || target.closest('textarea') || target.closest('button') ||
        target.closest('select') || target.closest('label') ||
        target.closest('[data-edit-menu]') || target.closest('[data-edit-button]')) {
      console.log('🎯 Click ignored - clicked on interactive element');
      return;
    }
    
    // Use centralized edit limits logic
    const safeEditHotspots = editHotspots || [];
    const currentSessionData = getCurrentSession('general-edit');
    const currentPhaseHotspotCount = currentSessionData?.currentEditPhaseHotspots?.length || 0;
    const totalHotspotsInSession = currentSessionData?.totalHotspots?.length || 0;
    // Check if there's an active (non-completed) session - ensure boolean, not null
    const hasActiveSession = !!(currentSessionData && currentSessionData.status !== 'completed');
    
    // Use the editLimits function, not the ToolStateManager one
    const canAddResult = canAddHotspotFromLimits({
      editCount: editCount || 0,
      hotspotCount: currentPhaseHotspotCount,
      totalHotspotsInSession,
      hasActiveSession
    });

    // Validate result
    if (!canAddResult || typeof canAddResult.canAdd !== 'boolean') {
      console.error('❌ [HOTSPOT] Invalid result from canAddHotspot:', canAddResult);
      updateState({
        processError: 'Unable to check edit point limits. Please try again.'
      });
      return;
    }

    if (!canAddResult.canAdd) {
      const reason = canAddResult.reason || 'Cannot add more edit points at this time.';
      console.log('🎯 Cannot add hotspot:', reason, { 
        editCount: editCount || 0, 
        currentPhaseHotspotCount, 
        totalHotspotsInSession, 
        hasActiveSession,
        canAddResult 
      });
      updateState({
        processError: reason
      });
      return;
    }
    
    console.log('✅ [HOTSPOT] Can add hotspot - proceeding');
   
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100 * 100) / 100; // Round to 2 decimal places
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100 * 100) / 100; // Round to 2 decimal places
    
    // Phase 1: Create new hotspot with session management
    const newHotspot = { 
      id: hotspotCounter, 
      x, 
      y,
      prompt: '',
      referenceImages: []
    };
    
    // Phase 3: Hotspot validation
    const validation = validateHotspotPlacement(newHotspot, safeEditHotspots);
    if (!validation.isValid) {
      console.log('🎯 Hotspot validation failed:', validation.reason);
      updateState({
        processError: validation.reason
      });
      return;
    }
    
    // Create session and add hotspot in one operation (fixes race condition)
    const success = createSessionAndAddHotspot('general-edit', newHotspot);
    if (!success) {
      console.log('🎯 Failed to create session and add hotspot');
      // Re-check limits to get the appropriate error message
      const recheckResult = canAddHotspot({
        editCount: editCount || 0,
        hotspotCount: currentPhaseHotspotCount,
        totalHotspotsInSession,
        hasActiveSession
      });
      const errorMsg = recheckResult.reason || 'Unable to add edit point. Please try again.';
      updateState({
        processError: errorMsg
      });
      return;
    }
    
    // Also update the legacy editHotspots for backward compatibility
    updateState({
      editHotspots: [...editHotspots, newHotspot],
      hotspotCounter: hotspotCounter + 1
    });
    console.log('🎯 Hotspot added to session:', newHotspot);
    
    // Auto-focus the input field for the new hotspot after a delay
    // Use a longer delay to ensure the DOM has been updated
    setTimeout(() => {
      const inputElement = document.getElementById(`hotspot-prompt-${newHotspot.id}`);
      if (inputElement) {
        inputElement.focus();
        inputElement.select(); // Also select any existing text
      } else {
        // If element not found, try again after a longer delay
        setTimeout(() => {
          const retryElement = document.getElementById(`hotspot-prompt-${newHotspot.id}`);
          if (retryElement) {
            retryElement.focus();
            retryElement.select();
          }
        }, 200);
      }
    }, 200);
  }, [activeTab, imageReady, originalSrc, showEnhanced, isDraggingHotspot, editHotspots, currentSession, createSessionAndAddHotspot, updateState, hotspotCounter, validateHotspotPlacement]);

  // Update hotspot prompt
  const updateHotspotPrompt = useCallback((hotspotId, prompt) => {
    console.log('🎯 [HOTSPOT_PROMPT] Updating prompt:', { hotspotId, prompt, length: prompt.length });
    updateState({
      editHotspots: editHotspots.map(hotspot => 
        hotspot.id === hotspotId ? { ...hotspot, prompt } : hotspot
      )
    });
  }, [editHotspots, updateState]);

  // Handle reference image upload for a hotspot
  const handleReferenceImageUpload = useCallback((hotspotId, referenceImage) => {
    console.log('📎 [REFERENCE_IMAGE] Updating hotspot with reference image:', { hotspotId, referenceImage });
    
    updateState({
      editHotspots: editHotspots.map(hotspot => {
        if (hotspot.id === hotspotId) {
          // If referenceImage is null, remove all reference images
          if (!referenceImage) {
            return {
              ...hotspot,
              referenceImages: []
            };
          }
          
          // Add or update reference image
          const existingRefs = hotspot.referenceImages || [];
          const refIndex = existingRefs.findIndex(ref => ref.id === referenceImage.id);
          
          if (refIndex >= 0) {
            // Update existing reference image
            const updatedRefs = [...existingRefs];
            updatedRefs[refIndex] = referenceImage;
            return {
              ...hotspot,
              referenceImages: updatedRefs
            };
          } else {
            // Add new reference image (limit to 1 per hotspot for general edit)
            return {
              ...hotspot,
              referenceImages: [referenceImage]
            };
          }
        }
        return hotspot;
      })
    });
  }, [editHotspots, updateState]);

  // Remove a specific hotspot - properly sync with session management
  const removeHotspot = useCallback((hotspotId) => {
    console.log(`🗑️ [HOTSPOT_REMOVE] Removing hotspot ${hotspotId}`);
    
    // Remove from editHotspots array
    const filtered = editHotspots.filter(hotspot => hotspot.id !== hotspotId);
    
    // Calculate next hotspot counter (use max existing ID + 1, or 1 if empty)
    const maxId = filtered.length > 0 ? Math.max(...filtered.map(h => h.id)) : 0;
    const nextHotspotCounter = maxId + 1;
    
    // Phase 1: Remove from session state using the proper function
    if (currentSession && removeHotspotFromSession) {
      const removed = removeHotspotFromSession('general-edit', hotspotId);
      if (removed) {
        console.log(`✅ [HOTSPOT_REMOVE] Removed from session`);
      }
    }
    
    // Update state - don't renumber IDs, keep original IDs for session tracking
    updateState({
      editHotspots: filtered,
      hotspotCounter: nextHotspotCounter,
      processError: null // Clear any error messages when hotspots are removed
    });
    
    console.log(`✅ [HOTSPOT_REMOVE] Hotspot removed. Remaining: ${filtered.length}, Next counter: ${nextHotspotCounter}`);
  }, [editHotspots, updateState, currentSession, removeHotspotFromSession]);

  // Phase 2: Optimized hotspot rendering with virtual scrolling for performance
  const renderHotspot = useCallback((hotspot) => {
    if (!hotspot.isVisible) return null;
    
    // Ensure backward compatibility: add referenceImages if missing
    const safeHotspot = {
      ...hotspot,
      referenceImages: hotspot.referenceImages || []
    };
    
    const colorData = safeHotspot.colorData;
    const isFocused = safeHotspot.isFocused;
    
    return (
      <motion.div
        key={hotspot.id}
        className="absolute pointer-events-auto"
        style={{
          left: `${safeHotspot.x}%`,
          top: `${safeHotspot.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: isFocused ? 1000 : 10
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Hotspot content with optimized rendering */}
        <div
          className="relative"
          style={{
            backgroundColor: colorData?.backgroundColor || 'rgba(0, 0, 0, 0.7)',
            border: `2px solid ${colorData?.borderColor || 'rgba(0, 0, 0, 0.8)'}`,
            borderRadius: '8px',
            padding: '8px',
            minWidth: '120px',
            maxWidth: '200px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Hotspot content */}
          <div className="flex items-center justify-between mb-2">
            <span 
              className="text-xs font-medium"
              style={{ 
                color: colorData?.textColor || 'rgba(255, 255, 255, 0.95)',
                textShadow: colorData?.textShadow || '0 1px 3px rgba(0,0,0,0.8)'
              }}
            >
              Hotspot {safeHotspot.id}
            </span>
            <button
              onClick={() => removeHotspot(safeHotspot.id)}
              className="text-white hover:text-red-300 transition-colors"
              style={{ fontSize: '12px' }}
            >
              ×
            </button>
          </div>
          
          <textarea
            id={`hotspot-prompt-${safeHotspot.id}`}
            value={safeHotspot.prompt || ''}
            onChange={(e) => updateHotspotPrompt(safeHotspot.id, e.target.value)}
            onFocus={() => setFocusedTextboxes(prev => new Set([...prev, safeHotspot.id]))}
            onBlur={() => setFocusedTextboxes(prev => {
              const newSet = new Set(prev);
              newSet.delete(safeHotspot.id);
              return newSet;
            })}
            placeholder="Describe what you want to edit..."
            className="w-full text-xs resize-none border-0 bg-transparent outline-none"
            style={{
              color: colorData?.textColor || 'rgba(255, 255, 255, 0.95)',
              textShadow: colorData?.textShadow || '0 1px 3px rgba(0,0,0,0.8)',
              fontSize: '12px',
              lineHeight: '1.4',
              height: 'auto',
              overflow: 'hidden',
              transform: safeHotspot.y > 80 ? 'translateY(-100%)' : 'translateY(0)',
              transformOrigin: 'bottom',
              ...(isMobile && {
                position: 'relative',
                zIndex: 9999
              })
            }}
            rows={1}
            disabled={isProcessing}
            autoFocus={isMobile}
          />
          
          {/* Reference Image Upload */}
          <div className="mt-2">
            <ReferenceUploader
              onReferenceUpload={(hotspotId, referenceImage) => handleReferenceImageUpload(hotspotId, referenceImage)}
              hotspotId={safeHotspot.id}
              disabled={isProcessing}
            />
          </div>
          
          {/* Reference Image Preview */}
          {safeHotspot.referenceImages && safeHotspot.referenceImages.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              {safeHotspot.referenceImages.map((refImage) => (
                <div key={refImage.id} className="relative">
                  <div className="w-8 h-8 rounded border border-white/20 overflow-hidden">
                    <img
                      src={refImage.preview || refImage.url}
                      alt={refImage.name || 'Reference'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  {refImage.selectionPoint && (
                    <div 
                      className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"
                      title={`Focus point: (${refImage.selectionPoint.x.toFixed(1)}%, ${refImage.selectionPoint.y.toFixed(1)}%)`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }, [removeHotspot, updateHotspotPrompt, handleReferenceImageUpload, isProcessing, isMobile, setFocusedTextboxes]);

  // Update hotspot position
  const updateHotspotPosition = useCallback((hotspotId, x, y) => {
    updateState({
      editHotspots: editHotspots.map(hotspot => 
        hotspot.id === hotspotId ? { ...hotspot, x, y } : hotspot
      )
    });
  }, [editHotspots, updateState]);


  // Handle hotspot container visibility
  const handleHotspotHover = useCallback((hotspotId) => {
    // Clear any existing timeout for this hotspot
    if (hoverTimeoutRef.current[hotspotId]) {
      clearTimeout(hoverTimeoutRef.current[hotspotId]);
      delete hoverTimeoutRef.current[hotspotId];
    }
    
    // Clear all other containers and show only this one
    setVisibleContainers(new Set([hotspotId]));
    
    // Clear persistent containers for other hotspots
    setPersistentContainers(prev => {
      const newSet = new Set(prev);
      newSet.delete(hotspotId); // Remove this hotspot from persistent
      return newSet;
    });
  }, []);

  const handleHotspotLeave = useCallback((hotspotId) => {
    // Don't hide if user is typing in the text box for this hotspot
    if (focusedTextboxes.has(hotspotId)) {
      console.log('🎯 Preventing hide - user is typing in text box');
      return;
    }
    
    // Check if textarea is currently focused
    const textarea = document.getElementById(`hotspot-prompt-${hotspotId}`);
    if (textarea && document.activeElement === textarea) {
      console.log('🎯 Preventing hide - textarea is focused');
      return;
    }
    
    // Only hide if not persistent
    if (!persistentContainers.has(hotspotId)) {
      // Set a timeout to hide the container
      hoverTimeoutRef.current[hotspotId] = setTimeout(() => {
        // Triple-check that user is not typing in text box before hiding
        if (focusedTextboxes.has(hotspotId)) {
          console.log('🎯 Preventing hide in timeout - user is typing in text box');
          return; // Don't hide if user is typing
        }
        
        // Check if textarea is still focused
        const textarea = document.getElementById(`hotspot-prompt-${hotspotId}`);
        if (textarea && document.activeElement === textarea) {
          console.log('🎯 Preventing hide in timeout - textarea is still focused');
          return;
        }
        
        console.log('🎯 Hiding container for hotspot:', hotspotId);
        setVisibleContainers(prev => {
          const newSet = new Set(prev);
          newSet.delete(hotspotId);
          return newSet;
        });
        delete hoverTimeoutRef.current[hotspotId];
      }, 500); // Increased delay to 500ms for better UX
    }
  }, [persistentContainers, focusedTextboxes]);

  const handleContainerClick = useCallback((hotspotId) => {
    // Make this container persistent and hide all others
    setPersistentContainers(new Set([hotspotId]));
    setVisibleContainers(new Set([hotspotId]));
    
    // Clear any existing hover timeouts
    Object.values(hoverTimeoutRef.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    hoverTimeoutRef.current = {};
  }, []);

  const handleContainerBlur = useCallback((hotspotId) => {
    // Don't remove persistence immediately - let the hover timeout handle it
    // This prevents the container from disappearing while user is still interacting
    setTimeout(() => {
      // Only remove persistence if the textarea is not focused
      const textarea = document.getElementById(`hotspot-prompt-${hotspotId}`);
      if (!textarea || document.activeElement !== textarea) {
        setPersistentContainers(prev => {
          const newSet = new Set(prev);
          newSet.delete(hotspotId);
          return newSet;
        });
      }
    }, 100);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(hoverTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Show containers for newly created hotspots and hide previous ones
  useEffect(() => {
    if (editHotspots && editHotspots.length > 0) {
      const latestHotspot = editHotspots[editHotspots.length - 1];
      if (latestHotspot && latestHotspot.id !== latestHotspotId) {
        // Update the latest hotspot ID
        setLatestHotspotId(latestHotspot.id);
        
        // Hide all previous containers and show only the newest one
        setVisibleContainers(new Set([latestHotspot.id]));
        setPersistentContainers(new Set()); // Clear all persistent containers
        setFocusedTextboxes(new Set()); // Clear all focused text boxes
        
        // Clear any existing hover timeouts to prevent conflicts
        Object.values(hoverTimeoutRef.current).forEach(timeout => {
          if (timeout) clearTimeout(timeout);
        });
        hoverTimeoutRef.current = {};
      }
    }
  }, [editHotspots, latestHotspotId]);

  const handleStartOver = () => {
    updateState({
      originalSrc: null,
      processedSrc: null,
      upscaledImage: null,
      processingImageUrl: null,
      showEnhanced: false,
      imageReady: false,
      processError: null,
      upscaleError: null,
      originalImageForComparison: null,
      customPrompt: '',
      activeTab: 'retouch',
      editHotspots: [],
      hotspotCounter: 1,
      history: [],
      historyIndex: -1
    });
  };

  const handleRestoreOriginal = () => {
    if (originalImageForComparison) {
      // Restore to the original uploaded image
      updateState({
        originalSrc: originalImageForComparison,
        processedSrc: null,
        upscaledImage: null,
        showEnhanced: false,
        processError: null,
        upscaleError: null,
        editHotspots: [],
        hotspotCounter: 1
      });
    }
  };

  const handleBackToHome = () => {
    router.push('/');
  };


  return (
    <motion.div
      ref={ref}
        className="relative rounded-[2rem] overflow-hidden shadow-2xl bg-white/5 border flex items-center justify-center"
      style={{
        width: originalSrc ? stableContainerDims.width : (isMobile ? '80vw' : '500px'),
        height: originalSrc ? stableContainerDims.height : (isMobile ? '40vh' : '300px'),
        maxWidth: '95vw',
        maxHeight: '85vh',
        marginTop: '80px', // Ensure container doesn't expand into nav bar area
        borderColor: 'rgba(200, 200, 200, 0.3)'
      }}
      initial={{ opacity: 1, scale: 1 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        width: originalSrc ? stableContainerDims.width : (isMobile ? '80vw' : '500px'),
        height: originalSrc ? stableContainerDims.height : (isMobile ? '40vh' : '300px')
      }}
      transition={{ 
        duration: 0, 
        ease: "easeInOut",
        layout: { duration: 0, ease: "easeInOut" }
      }}
      layout="position"
    >
      {/* Upload Placeholder with GlassSurface - only show when no image */}
      {!originalSrc && (
        <GlassSurface
          width="100%"
          height="100%"
          borderRadius={32}
          brightness={0}
          opacity={0}
          backgroundOpacity={0}
          blur={0}
          displace={35}
          distortionScale={-300}
          redOffset={15}
          greenOffset={25}
          blueOffset={35}
          mixBlendMode="screen"
          className={`group transition-all duration-300 ${
            (displayRemainingUploads === 0 && !isAdmin) ? 'cursor-default' : 'cursor-pointer hover:opacity-90'
          }`}
          style={{
            background: 'rgba(220, 220, 220, 0.2)',
            border: '1px solid rgba(200, 200, 200, 0.3)',
            backdropFilter: 'blur(4px) saturate(150%)',
            WebkitBackdropFilter: 'blur(4px) saturate(150%)'
          }}
          onClick={(displayRemainingUploads === 0 && !isAdmin) ? undefined : triggerFileSelect}
        >
          {/* Loading Overlay - Only mount when actually uploading */}
          {isUploading && (
            <div 
              className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-2xl"
              style={{
                background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.95) 100%)',
              }}
            >
              <Loader 
                message="Uploading image..."
                showMessage
              />
            </div>
          )}
          
          <div className="flex flex-col items-center justify-center w-full h-full">
            {(displayRemainingUploads === 0 && !isAdmin) ? (
              // No more uploads state
              <>
                <div className="mb-4 opacity-60">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                    {/* Door frame */}
                    <rect x="20" y="10" width="40" height="60" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/>
                    
                    {/* Closed door - solid panels */}
                    <rect x="22" y="12" width="36" height="56" rx="1" stroke="currentColor" strokeWidth="0.8" fill="currentColor" opacity="0.1"/>
                    
                    {/* Door handle */}
                    <circle cx="50" cy="40" r="1.5" fill="currentColor"/>
                    
                    {/* Door panel details - closed style */}
                    <line x1="30" y1="20" x2="30" y2="65" stroke="currentColor" strokeWidth="0.6" opacity="0.3"/>
                    <line x1="50" y1="20" x2="50" y2="65" stroke="currentColor" strokeWidth="0.6" opacity="0.3"/>
                    
                    {/* Vertical panel lines - closed door */}
                    <path d="M30 20 L35 25 M30 30 L38 38 M30 40 L40 50 M30 50 L42 62" 
                          stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" opacity="0.3"/>
                    
                    {/* Closed door indication - no opening */}
                    <rect x="22" y="12" width="36" height="56" fill="currentColor" opacity="0.05" rx="1"/>
                  </svg>
                </div>
                <p className="text-xl font-semibold mb-2 text-gray-800 dark:text-white/90">
                  {user ? 'Studio sessions limit reached' : 'Thank you for trying our studio'}
                </p>
                <p className="text-sm text-gray-600 dark:text-white/60 mb-4 text-center">
                  {user 
                    ? getMessageText()
                    : 'Please sign in to access 5 more uploads or subscribe to our monthly plan.'
                  }
                </p>
                <div className="flex justify-center pt-4">
                  {user ? (
                    <motion.button
                      whileTap={{ y: 2, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Show billing modal for users with active/canceled subscriptions
                        if (userData?.subscription?.status === 'active' || userData?.subscription?.status === 'canceled') {
                          if (onShowBillingModal) onShowBillingModal();
                        } else {
                          // Show subscription modal for users without subscriptions
                          if (onShowPaymentModal) onShowPaymentModal();
                        }
                      }}
                      className="about-devello-glass px-4 py-2 text-sm rounded-[2rem] font-medium transition-all duration-300"
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: isDark 
                          ? 'rgba(37, 99, 235, 0.6)' 
                          : 'rgba(37, 99, 235, 0.8)',
                        borderColor: isDark 
                          ? 'rgba(59, 130, 246, 0.4)' 
                          : 'rgba(37, 99, 235, 0.3)',
                        borderWidth: '1px',
                        color: 'white'
                      }}
                    >
                      {getButtonText()}
                    </motion.button>
                  ) : (
                    <motion.button
                      whileTap={{ y: 2, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCodeModal(true);
                      }}
                      className="about-devello-glass px-4 py-2 text-sm rounded-[2rem] font-medium transition-all duration-300"
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: isDark 
                          ? 'rgba(37, 99, 235, 0.6)' 
                          : 'rgba(37, 99, 235, 0.8)',
                        borderColor: isDark 
                          ? 'rgba(59, 130, 246, 0.4)' 
                          : 'rgba(37, 99, 235, 0.3)',
                        borderWidth: '1px',
                        color: 'white'
                      }}
                    >
                      Get more sessions
                    </motion.button>
                  )}
                </div>
              </>
            ) : (
              // Normal upload state
              <>
                <span className="text-6xl mb-4 opacity-60 group-hover:opacity-80 transition-opacity">📷</span>
                <p className="text-xl font-semibold mb-2 text-gray-800 dark:text-white/90 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  Upload Photo
                </p>
                <p className="text-sm text-gray-600 dark:text-white/60 group-hover:text-gray-700 dark:group-hover:text-white/80 transition-colors">
                  {isMobile ? "Tap to select or take a photo" : "Click to select an image"}
                </p>
                <p className="text-xs text-gray-500 dark:text-white/40 mt-1">
                  All images standardized for optimal AI processing
                </p>
              </>
            )}
          </div>
        </GlassSurface>
      )}

      {/* All image content - only render after container expansion */}
      {containerExpanded && originalSrc && (
        <motion.div
          className="w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Image Display */}
          {originalSrc && (
            <div 
              className="relative cursor-pointer"
              onClick={handleImageClick}
            >
          
              <motion.div
                className="w-full h-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1
                }}
                transition={{ 
                  duration: 0.8, 
                  ease: "easeInOut"
                }}
              >
            <ImageOverlay
              originalSrc={originalImageForComparison || originalSrc}
              processedSrc={processedSrc}
              showProcessed={showEnhanced}
              isProcessing={isProcessing}
              allowHoldCompare={true}
              className="rounded-2xl transition-all duration-300"
              alt={{ original: "Original Photo", processed: "Edited Photo" }}
            />
              </motion.div>
              
              {/* Hotspot indicators with inline input fields - only show when not processed and not processing */}
          {!showEnhanced && !isProcessing && (editHotspots || []).map((hotspot) => {
            // Ensure backward compatibility: add referenceImages if missing
            const safeHotspot = {
              ...hotspot,
              referenceImages: hotspot.referenceImages || []
            };
            
            // Calculate input field positioning to stay within container bounds
            const isMobile = isClientMobile; // Use client-side mobile detection
            const inputWidth = isMobile ? 140 : 180; // Shorter width for input field
            const inputHeight = isMobile ? 100 : 140; // Taller for reference button
            const dotSize = isMobile ? 24 : 32; // Smaller dots on mobile
            const margin = isMobile ? 4 : 8; // Tighter spacing on mobile
            
            // Calculate container dimensions
            const containerWidth = parseInt((stableContainerDims.width || '500').toString(), 10);
            const containerHeight = parseInt((stableContainerDims.height || '300').toString(), 10);
            
            // Convert hotspot position from percentage to pixels
            const dotX = (safeHotspot.x / 100) * containerWidth;
            const dotY = (safeHotspot.y / 100) * containerHeight;
            
            // Calculate input field position (centered below dot)
            let inputX = dotX - (inputWidth / 2);
            let inputY = dotY + (dotSize / 2) + (margin / 2) + (isMobile ? 20 : 20); // Mobile: 10px, Desktop: 20px
            
            // Check if input field would be clipped and adjust position
            if (inputX < 0) {
              // Input field would be clipped on the left, align to left edge
              inputX = 0;
            } else if (inputX + inputWidth > containerWidth) {
              // Input field would be clipped on the right, align to right edge
              inputX = containerWidth - inputWidth;
            }
            
            if (inputY + inputHeight > containerHeight) {
              // Input field would be clipped at bottom, position above dot
              if (isMobile) {
                // Mobile: closer positioning above dot
                inputY = dotY - (dotSize / 8) - (margin / 4) - inputHeight/2;
              } else {
                // Desktop: more spacing above dot
                inputY = dotY - (dotSize / 2) - (margin / 2) - inputHeight/2;
              }
            }
            
            // Convert back to percentage for CSS positioning
            const inputXPercent = (inputX / containerWidth) * 100;
            const inputYPercent = (inputY / containerHeight) * 100;
            
            return (
              <div key={hotspot.id}>
                {/* Hotspot dot - positioned at click center */}
                <div
                  ref={(el) => {
                    if (el) {
                      draggingRefs.current[hotspot.id] = el;
                    }
                  }}
                  className="absolute z-30 w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-[4px] border-2 border-solid rounded-full shadow-lg flex items-center justify-center cursor-move hover:scale-110 transition-all duration-300 ease-in-out"
                    style={{
                      left: `${safeHotspot.x}%`,
                      top: `${safeHotspot.y}%`,
                      transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(4px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(4px) saturate(150%)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {/* Reference Image Preview inside circle */}
                  {safeHotspot.referenceImages && safeHotspot.referenceImages.length > 0 ? (
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <img
                        src={safeHotspot.referenceImages[0].preview || safeHotspot.referenceImages[0].url}
                        alt={safeHotspot.referenceImages[0].name || 'Reference'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      {/* Overlay hotspot ID on top of image */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                        <span
                          className="text-xs font-bold"
                          style={{
                            color: hotspotColors[safeHotspot.id]?.textColor || 'rgba(255, 255, 255, 1)',
                            textShadow: '0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.6)'
                          }}
                        >
                          {safeHotspot.id}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span
                      className="text-xs font-bold"
                      style={{
                        color: hotspotColors[safeHotspot.id]?.textColor || 'rgba(255, 255, 255, 1)',
                        textShadow: '0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.6)'
                      }}
                    >
                      {safeHotspot.id}
                    </span>
                  )}
                  
                  {/* X button - positioned at top right of hotspot */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🗑️ [GENERAL_EDIT] Removing hotspot:', safeHotspot.id);
                      removeHotspot(safeHotspot.id);
                    }}
                    disabled={isProcessing}
                    className={`absolute text-red-500 hover:text-red-400 font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed drop-shadow-lg leading-none z-50 ${
                      isMobile ? 'text-2xl w-8 h-8 flex items-center justify-center -top-4 -right-4' : 'text-lg -top-3 -right-2'
                    }`}
                    style={{
                      textShadow: '0 0 8px rgba(239, 68, 68, 0.6), 0 0 16px rgba(239, 68, 68, 0.4)',
                      filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.8))',
                      ...(isMobile && {
                        minWidth: '32px',
                        minHeight: '32px',
                        touchAction: 'manipulation'
                      })
                    }}
                    title="Remove this edit point"
                  >
                    ×
                  </button>
                  
                  {/* Invisible larger hover area */}
                  <div
                    className="absolute inset-0 w-10 h-10 sm:w-16 sm:h-16 -translate-x-1/2 -translate-y-1/2 cursor-move"
                    style={{
                      left: '50%',
                      top: '50%'
                    }}
                    onMouseEnter={() => handleHotspotHover(safeHotspot.id)}
                    onMouseLeave={() => handleHotspotLeave(safeHotspot.id)}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      
                      // Set global drag state
                      setIsDraggingHotspot(true);
                      
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startHotspotX = safeHotspot.x;
                      const startHotspotY = safeHotspot.y;
                      
                      // Get stable reference to the hotspot element
                      const hotspotElement = draggingRefs.current[safeHotspot.id];
                      if (!hotspotElement) return;
                      
                      // Create a temporary dragging hotspot that follows the cursor
                      const tempHotspot = document.createElement('div');
                      const colorData = hotspotColors[hotspot.id];
                      tempHotspot.className = 'fixed z-50 w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-[4px] border-2 border-solid rounded-full shadow-lg flex items-center justify-center cursor-move pointer-events-none';
                      tempHotspot.style.cssText = `
                        left: ${e.clientX - 20}px;
                        top: ${e.clientY - 20}px;
                        transform: translate(0, 0);
                        background-color: rgba(0, 0, 0, 0.4);
                        border-color: rgba(255, 255, 255, 0.3);
                        backdrop-filter: blur(4px) saturate(150%);
                        -webkit-backdrop-filter: blur(4px) saturate(150%);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                      `;
                      // Create text element safely
                      const textSpan = document.createElement('span');
                      textSpan.className = 'text-xs font-bold';
                      textSpan.style.color = colorData?.textColor || 'rgba(255, 255, 255, 1)';
                      textSpan.textContent = safeHotspot.id; // Use textContent instead of innerHTML
                      tempHotspot.appendChild(textSpan);
                      document.body.appendChild(tempHotspot);
                      
                      // Hide the original hotspot using stable reference
                      hotspotElement.style.opacity = '0';
                      
                      const handleMouseMove = (moveEvent) => {
                        const deltaX = moveEvent.clientX - startX;
                        const deltaY = moveEvent.clientY - startY;
                        
                        // Update temporary hotspot position to follow cursor
                        tempHotspot.style.left = `${moveEvent.clientX - 16}px`;
                        tempHotspot.style.top = `${moveEvent.clientY - 16}px`;
                        
                        // Convert pixel movement to percentage using stable reference
                        const imageRect = hotspotElement.closest('.relative').querySelector('img').getBoundingClientRect();
                        const deltaXPercent = (deltaX / imageRect.width) * 100;
                        const deltaYPercent = (deltaY / imageRect.height) * 100;
                        
                        const newX = Math.max(0, Math.min(100, startHotspotX + deltaXPercent));
                        const newY = Math.max(0, Math.min(100, startHotspotY + deltaYPercent));
                        
                        // Update hotspot position (this will move the text container)
                        updateHotspotPosition(safeHotspot.id, newX, newY);
                      };
                      
                      const handleMouseUp = (mouseUpEvent) => {
                        // Prevent the click event from firing after this mouseup
                        mouseUpEvent.preventDefault();
                        mouseUpEvent.stopPropagation();
                        
                        // Calculate final position
                        const finalDeltaX = mouseUpEvent.clientX - startX;
                        const finalDeltaY = mouseUpEvent.clientY - startY;
                        const imageRect = hotspotElement.closest('.relative').querySelector('img').getBoundingClientRect();
                        const finalDeltaXPercent = (finalDeltaX / imageRect.width) * 100;
                        const finalDeltaYPercent = (finalDeltaY / imageRect.height) * 100;
                        const finalX = Math.max(0, Math.min(100, startHotspotX + finalDeltaXPercent));
                        const finalY = Math.max(0, Math.min(100, startHotspotY + finalDeltaYPercent));
                        
                        // Update hotspot to final position
                        updateHotspotPosition(safeHotspot.id, finalX, finalY);
                        
                        // Remove temporary hotspot safely
                        if (document.body.contains(tempHotspot)) {
                          document.body.removeChild(tempHotspot);
                        }
                        
                        // Show the original hotspot using stable reference
                        if (hotspotElement) {
                          hotspotElement.style.opacity = '1';
                        }
                        
                        // Clear global drag state after a delay to prevent immediate clicks
                        setTimeout(() => {
                          setIsDraggingHotspot(false);
                        }, 100);
                        
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />
                </div>
                
                {/* Inline input field - positioned to stay within bounds */}
                <div
                  className="absolute z-30 w-36 sm:w-44 flex flex-col transition-all duration-300 ease-in-out px-2 sm:px-3 pb-2 sm:pb-3"
                    style={{
                      left: `${inputXPercent}%`,
                      top: `${inputYPercent}%`,
                      transform: `translate(0, 0) scale(${visibleContainers.has(safeHotspot.id) ? 1 : 0.95})`,
                      opacity: visibleContainers.has(safeHotspot.id) ? 1 : 0,
                      visibility: visibleContainers.has(safeHotspot.id) ? 'visible' : 'hidden',
                      pointerEvents: visibleContainers.has(safeHotspot.id) ? 'auto' : 'none'
                    }}
                  onClick={() => handleContainerClick(safeHotspot.id)}
                  onBlur={() => handleContainerBlur(safeHotspot.id)}
                  onMouseEnter={() => {
                    // Clear any pending hide timeout when mouse enters container
                    if (hoverTimeoutRef.current[safeHotspot.id]) {
                      clearTimeout(hoverTimeoutRef.current[safeHotspot.id]);
                      delete hoverTimeoutRef.current[safeHotspot.id];
                    }
                    handleHotspotHover(safeHotspot.id);
                  }}
                  onMouseLeave={(e) => {
                    // Only trigger leave if mouse is not moving to a child element
                    const relatedTarget = e.relatedTarget;
                    if (relatedTarget && 
                        relatedTarget instanceof Node && 
                        e.currentTarget && 
                        e.currentTarget.contains && 
                        e.currentTarget.contains(relatedTarget)) {
                      return; // Mouse is moving to a child element, don't hide
                    }
                    handleHotspotLeave(safeHotspot.id);
                  }}
                >

                  {/* Text Input */}
                  <textarea
                    id={`hotspot-prompt-${safeHotspot.id}`}
                    value={safeHotspot.prompt || ''}
                    onChange={(e) => updateHotspotPrompt(safeHotspot.id, e.target.value)}
                    placeholder="Describe your edit..."
                    className="w-full px-3 py-1 sm:px-2 sm:py-1 bg-black/60 border border-gray-300/50 rounded-[2rem] resize-none focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-gray-300 text-white text-sm sm:text-base"
                    style={{
                      color: 'white',
                      backdropFilter: 'blur(4px)',
                      fontSize: isMobile ? '14px' : '16px', // Smaller font on mobile to prevent clipping
                      height: 'auto',
                      overflow: 'hidden',
                      transform: safeHotspot.y > 80 ? 'translateY(-100%)' : 'translateY(0)',
                      transformOrigin: 'bottom',
                      ...(isMobile && {
                        position: 'relative',
                        zIndex: 9999
                      })
                    }}
                    rows={1}
                    disabled={isProcessing}
                    autoFocus={isMobile}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={() => {
                      // Clear any pending hide timeout when user focuses on text box
                      if (hoverTimeoutRef.current[safeHotspot.id]) {
                        clearTimeout(hoverTimeoutRef.current[safeHotspot.id]);
                        delete hoverTimeoutRef.current[safeHotspot.id];
                      }
                      // Mark this text box as focused
                      setFocusedTextboxes(prev => new Set([...prev, safeHotspot.id]));
                      // Make container persistent when user is typing
                      setPersistentContainers(prev => new Set([...prev, safeHotspot.id]));
                      console.log('🎯 Text box focused - preventing hide and making persistent');
                    }}
                    onBlur={() => {
                      // Mark this text box as not focused
                      setFocusedTextboxes(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(safeHotspot.id);
                        return newSet;
                      });
                      console.log('🎯 Text box blurred');
                      
                      // Don't immediately remove persistence - let the container blur handler manage it
                      // This prevents the container from disappearing while user is still interacting
                    }}
                    onInput={(e) => {
                      // Auto-resize textarea to fit content
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    ref={(textarea) => {
                      if (textarea) {
                        // Auto-resize on mount and when value changes
                        textarea.style.height = 'auto';
                        textarea.style.height = textarea.scrollHeight + 'px';
                      }
                    }}
                  />
                  
                  {/* Reference Image Upload - Centered with input */}
                  <div className="mt-2 flex items-center justify-center">
                    <ReferenceUploader
                      onReferenceUpload={(hotspotId, referenceImage) => handleReferenceImageUpload(hotspotId, referenceImage)}
                      hotspotId={safeHotspot.id}
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

          {/* Loading Overlay - Only for upload and preview preparation */}
          {(isUploading || isPreparingPreview) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black backdrop-blur-2xl">
              <Loader 
                message={
                  isUploading ? "Uploading image..." :
                  isPreparingPreview ? "Preparing preview..." : null
                } 
                showMessage={true}
                animatedMessages={isUploading}
                isUploading={isUploading}
              />
            </div>
          )}
          
          {/* Processing Overlay - Only for AI processing */}
          {isProcessing && (
            <div 
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30"
              style={{
                backdropFilter: isMobile ? 'blur(8px)' : 'blur(24px)',
                WebkitBackdropFilter: isMobile ? 'blur(8px)' : 'blur(24px)',
                willChange: 'auto'
              }}
            >
              <Loader 
                message={null}
                showMessage={true}
                animatedMessages={true}
                isUploading={false}
              />
            </div>
          )}
          
          {/* Upscaling Indicator - Bottom Right */}
          {isUpscaling && (
            <div className="absolute bottom-4 right-4 z-30">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-medium"
                style={{ 
                  textShadow: '0 0 10px rgba(255,255,255,0.3)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                Upscaling
              </motion.div>
            </div>
          )}
      </motion.div>
      )}

      {/* Edit Count Display - Show when image is ready and has been edited */}
      {imageReady && editCount > 0 && (
        <div className="absolute top-4 left-4 z-20">
          <div className="sm:px-3 sm:py-1.5 rounded-[2rem] text-xs border text-white"
               style={{ 
                 paddingTop: '0.25rem', 
                 paddingBottom: '0.25rem', 
                 paddingLeft: '0.5rem', 
                 paddingRight: '0.5rem',
                 background: 'rgba(59, 130, 246, 0.3)',
                 borderColor: 'rgba(96, 165, 250, 0.4)',
                 backdropFilter: 'blur(4px) saturate(150%)',
                 WebkitBackdropFilter: 'blur(4px) saturate(150%)',
                 color: '#ffffff'
               }}>
            Edits: {editCount}/3
          </div>
        </div>
      )}

      {/* Action Buttons - Only show after image is ready and not processing */}
      {imageReady && !isProcessing && !isUpscaling && (
        <ActionButtons
          showEnhanced={showEnhanced}
          editHotspots={editHotspots}
          upscaledImage={upscaledImage}
          canUndo={canUndo}
          canRedo={canRedo}
          isProcessing={isProcessing}
          updateState={updateState}
          processingImageUrl={processingImageUrl}
          processedSrc={processedSrc}
          hotspotCounter={hotspotCounter}
          uploadId={uploadId}
          markUploadAsProcessed={markUploadAsProcessed}
          refreshAfterUpload={refreshAfterUpload}
          processRetouch={processRetouch}
          isMobile={isMobile}
          decrementEditCount={decrementEditCount}
          editCount={editCount}
          history={history}
          historyIndex={historyIndex}
          revertToHistory={revertToHistory}
          editSessions={editSessions}
          currentSession={currentSession}
          originalSrc={originalSrc}
          customPrompt={customPrompt}
        />
      )}

      {/* Top Right Controls */}
      {originalSrc && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-3 right-3 flex gap-1.5 z-30"
        >
          {showEnhanced && (
            <Button
              onClick={handleRestoreOriginal}
              className="sm:px-3 sm:py-0.5 text-xs font-medium transition-all duration-200"
              style={{ 
                paddingTop: '0.25rem', 
                paddingBottom: '0.25rem', 
                paddingLeft: '0.5rem', 
                paddingRight: '0.5rem',
                background: 'rgba(59, 130, 246, 0.3)',
                border: '1px solid rgba(96, 165, 250, 0.4)',
                backdropFilter: 'blur(4px) saturate(150%)',
                WebkitBackdropFilter: 'blur(4px) saturate(150%)'
              }}
            >
              Original
            </Button>
          )}
          <Button
            onClick={handleStartOver}
            className={RESET_HOME_BUTTON_CLASS}
            style={RESET_HOME_BUTTON_STYLE}
            detectContrast={false}
          >
            Reset
          </Button>
          <Button
            onClick={handleBackToHome}
            className={RESET_HOME_BUTTON_CLASS}
            style={RESET_HOME_BUTTON_STYLE}
            detectContrast={false}
          >
            ← Home
          </Button>
        </motion.div>
      )}

      {/* Back to Home (when no image) */}
      {!originalSrc && (
        <Button
          onClick={handleBackToHome}
          className={`absolute top-3 right-3 ${RESET_HOME_BUTTON_CLASS} z-30`}
          style={RESET_HOME_BUTTON_STYLE}
          detectContrast={false}
        >
          ← Home
        </Button>
      )}

      {/* Error Messages */}
      {processError && (
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 max-w-xs">
          <div className="px-3 py-1.5 bg-red-600/80 backdrop-blur-sm rounded-lg text-white text-xs border border-red-400/50">
            {processError}
          </div>
        </div>
      )}

      {upscaleError && (
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 max-w-xs">
          <div className="px-3 py-1.5 bg-red-600/80 backdrop-blur-sm rounded-lg text-white text-xs border border-red-400/50">
            {upscaleError}
          </div>
        </div>
      )}

      {/* Code Input Modal */}
      <CodeInputModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        isDark={isDark}
      />

    </motion.div>
  );
});

ImageContainer.displayName = 'ImageContainer';

export default ImageContainer;
