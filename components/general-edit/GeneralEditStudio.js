import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../auth/AuthProvider';
import { useToolState } from '../contexts/ToolStateManager';
import { ToolStateContext } from '../contexts/ToolStateManager';
import { getSupabase } from '../../lib/supabaseClient';
import CentralizedUploadCounter from '../CentralizedUploadCounter';
import ImageContainer from './components/ImageContainer';
import ActionButtons from './components/ActionButtons';
import { useImageProcessing } from './hooks/useImageProcessing';
import { useAIImageProcessing } from './hooks/useAIImageProcessing';
import GlobalBackground from '../GlobalBackground';
import { canProcessEdits } from '../../lib/editLimits';

function GeneralEditStudio({ onShowAuthModal, onShowPaymentModal, onShowBillingModal, onDirectPayment }) {
  const router = useRouter();
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  
  
  // Upload stats are now handled by CentralizedUploadCounter
  
  // Use the new tool state management
  const {
    originalSrc,
    processedSrc,
    isProcessing,
    isUploading,
    showEnhanced,
    imageReady,
    upscaledImage,
    isUpscaling,
    upscaleError,
    processError,
    processingImageUrl,
    isPreparingPreview,
    customPrompt,
    activeTab,
    editHotspots,
    hotspotCounter,
    history,
    historyIndex,
    originalImageForComparison,
    containerDims,
    stableContainerDims,
    uploadId,
    updateState,
    updateActivity,
    markUploadAsProcessed,
    hasActiveWork,
    incrementEditCount,
    decrementEditCount,
    resetEditCount,
    getEditCount,
    canEdit,
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
  canAddHotspot
  } = useToolState('general-edit');

  // Debug: Monitor state changes in GeneralEditStudio
  useEffect(() => {
    // console.log('GeneralEditStudio state:', {
    //   imageReady, 
    //   originalSrc: !!originalSrc, 
    //   showEnhanced, 
    //   isProcessing,
    //   editHotspots: editHotspots?.length || 0,
    //   currentSession: !!currentSession
    // });
  }, [imageReady, originalSrc, showEnhanced, isProcessing, editHotspots, currentSession]);
  
  // Get tool-specific background state from context
  const { updateToolBackgroundState } = React.useContext(ToolStateContext);
  
  const previousObjectUrlRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  // Fetch user data when user signs in
  const [userDataLoading, setUserDataLoading] = useState(false);
  
  // Track activity for the tool state manager
  useEffect(() => {
    updateActivity();
  }, []); // Only run once on mount

  // Reset edit count when a new image is uploaded
  useEffect(() => {
    if (originalSrc) {
      // Reset edit count when new image is uploaded (handled by ToolStateManager)
    }
  }, [originalSrc]);

  // Update tool-specific background state when image state changes
  useEffect(() => {
    const hasImage = !!originalSrc;
    updateToolBackgroundState('general-edit', hasImage);
  }, [originalSrc, updateToolBackgroundState]);

  // Handle tab visibility changes to prevent state corruption
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - preserve current state
      } else {
        // Tab is visible again - refresh state if needed
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [updateActivity]);

  // Handle Stripe redirect parameters for single upload purchases
  useEffect(() => {
    const { payment } = router.query;
    
    if (payment === 'success') {
      // Single upload purchase was successful
      
      // Wait for session to be fully restored before fetching user data
      const handleSuccess = async () => {
        // Wait a bit for session restoration
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh user data to get updated upload count
        if (user && !userDataLoading) {
          setUserDataLoading(true);
          // Re-fetch user data
          const fetchUserData = async () => {
            try {
              const supabase = getSupabase();
              if (!supabase) {
                throw new Error('Supabase client not available');
              }
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.access_token) {
                throw new Error('No session token available');
              }

              const response = await fetch('/api/user/profile', {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                setUserData(data);
              } else {
                console.error('Failed to fetch user data:', response.status);
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
            } finally {
              setUserDataLoading(false);
            }
          };
          fetchUserData();
        }
        
        // Upload stats are automatically refreshed by ToolStateManager
      };
      
      handleSuccess();
      // Clean up URL
      router.replace(router.pathname, undefined, { shallow: true });
    } else if (payment === 'canceled') {
      // Single upload purchase was canceled
      // Clean up URL
      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query, user, userDataLoading]);
  
  useEffect(() => {
    if (user && !userData && !userDataLoading) {
      setUserDataLoading(true);
      // Get the session token from Supabase
      const fetchUserData = async () => {
        try {
          const supabase = getSupabase();
          if (!supabase) {
            throw new Error('Supabase client not available');
          }
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            throw new Error('No session token available');
          }

          const response = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          } else {
            console.error('Failed to fetch user data:', response.status);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setUserDataLoading(false);
        }
      };
      
      fetchUserData();
    } else if (!user) {
      setUserData(null);
      setUserDataLoading(false);
    }
  }, [user]); // Only depend on user

  // Responsive breakpoints - SSR safe
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set mobile/tablet state after component mounts
  useEffect(() => {
    setIsClient(true);
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Ref for the main image container
  const imageContainerRef = useRef(null);

  // Initialize the image processing hooks
  const { handleFileChange } = useImageProcessing(updateState, user, setUserData);
  
  // No-op function since ToolStateManager handles upload stats automatically
  const refreshAfterUpload = useCallback(() => {
    // Upload stats are automatically refreshed by ToolStateManager
    // This is kept for compatibility with useAIImageProcessing hook
  }, []);
  
  // Session completion callback
  const handleSessionComplete = useCallback((result) => {
    console.log('🎯 [SESSION_COMPLETE] handleSessionComplete called with result:', !!result);
    // Use the ToolStateManager's completeEditSession function to properly handle session completion
    if (completeEditSession) {
      console.log('🎯 [SESSION_COMPLETE] Calling completeEditSession...');
      const success = completeEditSession('general-edit', result);
      if (success) {
        console.log('✅ [SESSION_COMPLETE] Session completed successfully');
      } else {
        console.log('⚠️ [SESSION_COMPLETE] Session completion failed');
      }
    } else {
      // Fallback to manual session completion if completeEditSession is not available
      const currentEditSessions = editSessions || [];
      if (currentEditSessions.length > 0) {
        const lastSession = currentEditSessions[currentEditSessions.length - 1];
        if (lastSession && lastSession.result === 'processing') {
          // Update the session with the final result
          const updatedSessions = currentEditSessions.map(session => 
            session.id === lastSession.id 
              ? { ...session, result, status: 'completed', completedAt: Date.now() }
              : session
          );
          updateState({ 
            editSessions: updatedSessions,
            currentSession: null, // Clear current session to allow new hotspots for next edit
            editHotspots: [], // Clear hotspots for next edit
            hotspotCounter: 1 // Reset hotspot counter for next edit
          });
        }
      }
    }
  }, [editSessions, updateState, completeEditSession]);

  const { processImage, processRetouch: originalProcessRetouch, handleUpscale } = useAIImageProcessing(
    updateState, 
    user, 
    setUserData, 
    uploadId, 
    markUploadAsProcessed, 
    refreshAfterUpload,
    processingImageUrl,
    containerDims,
    originalImageForComparison,
    originalSrc,
    handleSessionComplete
  );

  // Wrapper for processRetouch with edit limit check
  const processRetouch = useCallback(async (hotspots) => {
    // Use centralized edit limits logic
    const canProcessResult = canProcessEdits({
      editCount: getEditCount('general-edit'),
      hotspots
    });

    if (!canProcessResult.canProcess) {
      updateState({
        processError: canProcessResult.reason
      });
      return;
    }

    // Increment edit count before processing
    incrementEditCount('general-edit');

    // Call the original processRetouch function with valid hotspots
    try {
      await originalProcessRetouch(canProcessResult.validHotspots);
    } catch (error) {
      console.error('❌ [PROCESS_RETOUCH] Error in originalProcessRetouch:', error);
      updateState({
        processError: 'Failed to process image. Please try again.'
      });
      return;
    }
  }, [originalProcessRetouch, incrementEditCount, getEditCount, updateState]);

  // Handle file input change with proper cleanup
  const onFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      console.log('⚠️ [FILE_UPLOAD] No file selected');
      // Reset file input even if no file selected
      if (event.target) {
        event.target.value = '';
      }
      return;
    }
    
    try {
      // Reset edit count and clear previous state when new image is uploaded
      resetEditCount('general-edit');
      
      // Clear previous errors and processing states
      updateState({
        processError: null,
        upscaleError: null,
        editHotspots: [],
        hotspotCounter: 1,
        showEnhanced: false,
        processedSrc: null,
        upscaledImage: null
      });
      
      // Handle the file upload
      await handleFileChange(event, onShowPaymentModal);
      
      // Reset file input AFTER successful processing to allow selecting the same file again
      if (event.target) {
        event.target.value = '';
      }
    } catch (error) {
      console.error('❌ [FILE_UPLOAD] Error in onFileChange:', error);
      updateState({
        processError: 'Failed to process file. Please try again.',
        isUploading: false,
        imageReady: false
      });
      // Reset file input on error too
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [handleFileChange, onShowPaymentModal, resetEditCount, updateState]);

  // History management
  const addImageToHistory = useCallback((newImageFile) => {
    const safeHistory = history || [];
    const safeHistoryIndex = historyIndex || -1;
    const newHistory = safeHistory.slice(0, safeHistoryIndex + 1);
    newHistory.push(newImageFile);
    updateState({
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  }, [history, historyIndex, updateState]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < (history?.length || 0) - 1;

  const handleUndo = () => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      revertToHistory('general-edit', newIndex);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      revertToHistory('general-edit', newIndex);
    }
  };


  return (
    <>
      {/* Global Background - persists across tool switches */}
      <GlobalBackground toolType="general-edit" toolId="general-edit" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        <div className="flex flex-col items-center justify-center w-full min-h-[80vh]">
          {/* Main Image Container */}
          <ImageContainer
            ref={imageContainerRef}
            originalSrc={originalSrc}
            processedSrc={processedSrc}
            showEnhanced={showEnhanced}
            isProcessing={isProcessing}
            isUpscaling={isUpscaling}
            isPreparingPreview={isPreparingPreview}
            isUploading={isUploading}
            editHotspots={editHotspots}
            hotspotCounter={hotspotCounter}
            activeTab={activeTab}
            imageReady={imageReady}
            containerDims={containerDims}
            stableContainerDims={stableContainerDims}
            isMobile={isClient ? isMobile : false}
            processError={processError}
            upscaleError={upscaleError}
            updateState={updateState}
            fileInputRef={fileInputRef}
            onShowPaymentModal={onShowPaymentModal}
            onShowBillingModal={onShowBillingModal}
            onDirectPayment={onDirectPayment}
            onShowAuthModal={onShowAuthModal}
            user={user}
            userData={userData}
            setUserData={setUserData}
            uploadId={uploadId}
            markUploadAsProcessed={markUploadAsProcessed}
            originalImageForComparison={originalImageForComparison}
            upscaledImage={upscaledImage}
            processingImageUrl={processingImageUrl}
            userProfile={user ? { name: user.user_metadata?.full_name || user.email } : null}
            history={history}
            historyIndex={historyIndex}
            canUndo={canUndo}
            canRedo={canRedo}
            processRetouch={processRetouch}
            editCount={getEditCount('general-edit')}
            decrementEditCount={decrementEditCount}
            revertToHistory={revertToHistory}
            // Phase 1: Edit session management
            editSessions={editSessions}
            currentSession={currentSession}
            maxSessions={maxSessions}
            maxHotspotsPerSession={maxHotspotsPerSession}
            createEditSession={createEditSession}
            addHotspotToSession={addHotspotToSession}
            removeHotspotFromSession={removeHotspotFromSession}
            createSessionAndAddHotspot={createSessionAndAddHotspot}
            completeEditSession={completeEditSession}
            revertToSession={revertToSession}
            getCurrentSession={getCurrentSession}
            canAddHotspot={canAddHotspot}
          />

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif,image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      </div>


      {/* Upload Counter - Positioned above footer */}
      <div className="relative w-full flex justify-center z-40 mb-4 pt-8">
        <CentralizedUploadCounter />
      </div>
    </>
  );
}

export default GeneralEditStudio;
