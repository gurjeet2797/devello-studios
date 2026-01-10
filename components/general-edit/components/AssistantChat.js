import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../ui/Button';

const AssistantChat = ({ userProfile, onClose, editHotspots, onImageSelect }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showHotspotSelector, setShowHotspotSelector] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Removed auto-scroll to prevent page shifting

  useEffect(() => {
    if (!isInitialized) {
      initializeAssistant();
    }
  }, [isInitialized]);

  const initializeAssistant = async () => {
    console.log('Initializing assistant with user profile:', {
      hasUserProfile: !!userProfile
    });
    
    // Create a simple greeting for general edit
    const greeting = "Hi! I'm your editing assistant. Please upload your image to get started.";
    
    setMessages([{
      id: Date.now(),
      type: 'assistant',
      content: greeting,
      images: [],
      timestamp: new Date()
    }]);
    
    setIsLoading(false);
    setIsInitialized(true);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;


    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const requestBody = {
        message: inputMessage,
        userProfile
      };
      
      
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.response) {
        if (data.images && data.images.length > 0) {
        }
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'assistant',
          content: data.response,
          images: data.images || [],
          timestamp: new Date()
        }]);
      } else {
        throw new Error('No response received from assistant');
      }
    } catch (error) {
      console.error('❌ [ASSISTANT_CHAT] Failed to send message:', error);
      console.error('❌ [ASSISTANT_CHAT] Error details:', {
        message: error.message,
        stack: error.stack
      });
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageClick = (image) => {
    if (editHotspots && editHotspots.length > 0) {
      setSelectedImage(image);
      setShowHotspotSelector(true);
    } else {
      // No hotspots available, show message
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'assistant',
        content: "Please create a hotspot on your image first by clicking on it, then you can add this reference image to that hotspot.",
        images: [],
        timestamp: new Date()
      }]);
    }
  };

  const handleHotspotSelect = (hotspotId) => {
    if (onImageSelect && selectedImage) {
      onImageSelect(hotspotId, selectedImage);
    }
    setSelectedImage(null);
    setShowHotspotSelector(false);
  };

  const cancelImageSelection = () => {
    setSelectedImage(null);
    setShowHotspotSelector(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-center p-4 relative">
        <h2 className="text-lg font-normal text-gray-800 dark:text-white">
          Editing Assistant
        </h2>
        <button
          onClick={onClose}
          className="absolute right-4 p-1 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Messages Area - Scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 flex-shrink-0">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white ml-4'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white mr-4'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                
                {/* Display images if present */}
                {message.images && message.images.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.images.map((image, index) => (
                      <div key={index} className="relative group">
                        {image.type === 'web_search' && (
                          <img
                            src={image.url}
                            alt={image.description || `Reference image ${index + 1}`}
                            className="max-w-full h-auto rounded-lg shadow-sm cursor-pointer hover:shadow-lg transition-shadow duration-200"
                            style={{ maxHeight: '300px' }}
                            onClick={() => handleImageClick(image)}
                            crossOrigin="anonymous"
                            onError={(e) => {
                              // Prevent infinite loops by checking if we've already handled this error
                              if (e.target.dataset.errorHandled === 'true') {
                                return;
                              }
                              e.target.dataset.errorHandled = 'true';
                              
                              
                              // If this is already a proxy URL, don't try again
                              if (image.url.includes('images.weserv.nl')) {
                                e.target.style.display = 'none';
                                if (e.target.parentNode) {
                                  const placeholder = document.createElement('div');
                                  placeholder.className = 'w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500';
                                  placeholder.textContent = 'Image unavailable';
                                  e.target.parentNode.replaceChild(placeholder, e.target);
                                }
                                return;
                              }
                              
                              // Try to load with a proxy
                              const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(image.url)}`;
                              e.target.src = proxyUrl;
                              
                              e.target.onerror = () => {
                                // Prevent infinite loops
                                if (e.target.dataset.proxyErrorHandled === 'true') {
                                  return;
                                }
                                e.target.dataset.proxyErrorHandled = 'true';
                                
                                
                                // Try alternative proxy as last resort
                                if (!e.target.dataset.alternativeProxyTried) {
                                  e.target.dataset.alternativeProxyTried = 'true';
                                  
                                  // Try different proxy services
                                  const alternativeProxies = [
                                    `https://cors-anywhere.herokuapp.com/${image.originalUrl || image.url}`,
                                    `https://api.allorigins.win/raw?url=${encodeURIComponent(image.originalUrl || image.url)}`,
                                    `https://thingproxy.freeboard.io/fetch/${image.originalUrl || image.url}`
                                  ];
                                  
                                  const proxyIndex = parseInt(e.target.dataset.proxyIndex || '0');
                                  if (proxyIndex < alternativeProxies.length) {
                                    const alternativeProxyUrl = alternativeProxies[proxyIndex];
                                    e.target.dataset.proxyIndex = (proxyIndex + 1).toString();
                                    e.target.src = alternativeProxyUrl;
                                    
                                    e.target.onerror = () => {
                                      e.target.style.display = 'none';
                                      if (e.target.parentNode) {
                                        const placeholder = document.createElement('div');
                                        placeholder.className = 'w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500';
                                        placeholder.textContent = 'Image unavailable';
                                        e.target.parentNode.replaceChild(placeholder, e.target);
                                      }
                                    };
                                    return;
                                  }
                                }
                                
                                // All attempts failed, show placeholder
                                e.target.style.display = 'none';
                                if (e.target.parentNode) {
                                  const placeholder = document.createElement('div');
                                  placeholder.className = 'w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500';
                                  placeholder.textContent = 'Image unavailable';
                                  e.target.parentNode.replaceChild(placeholder, e.target);
                                }
                              };
                            }}
                            onLoad={() => {
                            }}
                          />
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-between">
                          <span>
                            {image.description || 'Reference image'}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-500 text-xs">
                            Click to add as reference
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className={`text-xs mt-1 ${
                  message.type === 'user' 
                    ? 'text-blue-100' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl mr-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="p-4 pt-2 flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about editing your image..."
               className="w-full p-1 pr-12 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 leading-tight"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
               className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            onClick={() => setInputMessage("Find inspiration images for similar styles and show me examples")}
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          >
            🖼️ Find Inspiration
          </Button>
          <Button
            onClick={() => setInputMessage("Suggest editing techniques for this image")}
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          >
            ✨ Edit Suggestions
          </Button>
          <Button
            onClick={() => setInputMessage("Show me current design trends and examples for this style")}
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          >
            🎨 Design Trends
          </Button>
          <Button
            onClick={() => setInputMessage("Generate some visual examples of what I could add to this image")}
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          >
            🎭 Visual Examples
          </Button>
        </div>
      </div>

      {/* Hotspot Selector Modal */}
      {showHotspotSelector && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Add Reference Image
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Select which hotspot to add this reference image to:
            </p>
            
            <div className="space-y-2 mb-6">
              {editHotspots.map((hotspot) => (
                <button
                  key={hotspot.id}
                  onClick={() => handleHotspotSelect(hotspot.id)}
                  className="w-full p-3 text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-800 dark:text-white">
                    Hotspot {hotspot.id}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {hotspot.prompt || 'No description yet'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Position: ({hotspot.x}%, {hotspot.y}%)
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={cancelImageSelection}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssistantChat;
