import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../auth/AuthProvider';
import { useToolState } from '../contexts/ToolStateManager';
import { getSupabase } from '../../lib/supabaseClient';
import CentralizedUploadCounter from '../CentralizedUploadCounter';
import AssistedImageContainer from './AssistedImageContainer';
import ActionButtons from '../general-edit/components/ActionButtons';
import { useAssistedImageProcessing } from './hooks/useAssistedImageProcessing';
import { useAIImageProcessing } from '../general-edit/hooks/useAIImageProcessing';

function AssistedEditStudio({ onShowAuthModal, onShowPaymentModal, onDirectPayment }) {
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
    imageCaption,
    isCaptionPending,
    updateState,
    updateActivity,
    markUploadAsProcessed,
    hasActiveWork
  } = useToolState('assisted-edit');
  
  const previousObjectUrlRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  // Fetch user data when user signs in
  const [userDataLoading, setUserDataLoading] = useState(false);
  
  // Track activity for the tool state manager
  useEffect(() => {
    updateActivity();
  }, []); // Only run once on mount - updateActivity is stable due to useCallback

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
        
        // Refresh upload stats after successful purchase
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

  // Set mobile/tablet state after component mounts
  useEffect(() => {
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
  const { handleFileChange, generateImageCaption } = useAssistedImageProcessing(updateState, user, setUserData);
  const { processImage, processRetouch, handleUpscale } = useAIImageProcessing(
    updateState, 
    user, 
    setUserData, 
    uploadId, 
    markUploadAsProcessed, 
    processingImageUrl,
    containerDims,
    originalImageForComparison,
    originalSrc
  );

  // Handle file input change
  const onFileChange = useCallback((event) => {
    handleFileChange(event, onShowPaymentModal);
  }, [handleFileChange, onShowPaymentModal]);

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
      updateState({ historyIndex: historyIndex - 1 });
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      updateState({ historyIndex: historyIndex + 1 });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col items-center w-full">
        {/* Main Image Container with AI Chat */}
        <AssistedImageContainer
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
          isMobile={isMobile}
          processError={processError}
          upscaleError={upscaleError}
          updateState={updateState}
          fileInputRef={fileInputRef}
          onShowPaymentModal={onShowPaymentModal}
          user={user}
          userData={userData}
          setUserData={setUserData}
          uploadId={uploadId}
          markUploadAsProcessed={markUploadAsProcessed}
          originalImageForComparison={originalImageForComparison}
          upscaledImage={upscaledImage}
          processingImageUrl={processingImageUrl}
          imageCaption={imageCaption}
          isCaptionPending={isCaptionPending}
          userProfile={user ? { name: user.user_metadata?.full_name || user.email } : null}
          history={history}
          historyIndex={historyIndex}
          canUndo={canUndo}
          canRedo={canRedo}
          processRetouch={processRetouch}
        />

        {/* Upload Counter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 max-w-md mx-auto"
        >
          <CentralizedUploadCounter />
        </motion.div>

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
  );
}

export default AssistedEditStudio;


