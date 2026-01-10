import React, { useState } from 'react';
import ChatInput from './ChatInput';

const AssistedEditAssistantChat = ({ 
  imageCaption, 
  userProfile, 
  editHotspots, 
  onImageSelect,
  isCaptionPending,
  onReferenceImagesReceived
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Gate: require image before processing
    if (!imageCaption) {
      setInputMessage('');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          imageCaption,
          userProfile,
          editHotspots: editHotspots || []
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Chat response received:', {
        responseLength: data.response?.length || 0,
        imageCount: data.images?.length || 0
      });
      
      // Pass reference images to parent component instead of displaying in chat
      if (onReferenceImagesReceived && data.images && data.images.length > 0) {
        onReferenceImagesReceived(data.images);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setInputMessage('');
    }
  };

  return (
    <div className="w-full">
      {/* Chat Input Only - No chat display */}
      <div className="p-4">
        <ChatInput
          input={inputMessage}
          setInput={setInputMessage}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          disabled={!imageCaption}
        />
      </div>
    </div>
  );
};

export default AssistedEditAssistantChat;
