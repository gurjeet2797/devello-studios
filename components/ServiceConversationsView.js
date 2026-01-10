import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import ConversationMessagesView from './ConversationMessagesView';
import ServiceConversationsList from './ServiceConversationsList';

function filterConversationsByServiceType(conversations, serviceType) {
  if (!conversations || !serviceType) return [];
  
  const normalizedServiceType = serviceType.toLowerCase();
  return conversations.filter(conv => {
    const convServiceType = conv.partner?.serviceType?.toLowerCase() || '';
    if (normalizedServiceType === 'manufacturing') {
      return convServiceType.includes('manufacturing');
    } else if (normalizedServiceType === 'consulting') {
      return convServiceType.includes('consulting');
    } else if (normalizedServiceType === 'software') {
      return convServiceType.includes('software') || convServiceType.includes('software_dev');
    } else if (normalizedServiceType === 'construction') {
      return convServiceType.includes('construction');
    }
    return false;
  });
}

export default function ServiceConversationsView({
  isDark,
  conversations,
  selectedConversation,
  messages,
  newMessage,
  setNewMessage,
  attachments,
  setAttachments,
  sending,
  isTyping,
  setIsTyping,
  clientIsLive,
  partnerIsLive,
  partnerIsTyping,
  streamingMessage,
  messagesEndRef,
  messagesContainerRef,
  fetchConversation,
  sendMessage,
  getServiceTypeColor,
  getServiceColors,
  conversationLoading,
  conversationError,
  conversationContainerRef,
  containerWrapperRef,
  textareaRef,
  adjustTextareaHeight,
  serviceType,
  emptyStateIcon: EmptyStateIcon,
  emptyStateMessage,
  isPartner = false,
  onFileUpload,
  onRequestPhoneAccess,
  onRequestUpdate,
  partnerPhone
}) {
  const serviceConversations = filterConversationsByServiceType(conversations, serviceType);

  const handleConversationClick = (convId) => {
    if (convId === null) {
      fetchConversation(null);
    } else {
      fetchConversation(convId);
    }
  };

  return (
    <div ref={containerWrapperRef}>
      <AnimatePresence mode="wait">
        {serviceConversations.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              duration: 0.5, 
              delay: 0.3,
              ease: "easeOut" 
            }}
            className="w-full"
          >
            <motion.div
              ref={conversationContainerRef}
              className="about-devello-glass rounded-3xl border-2 flex flex-col flex-1 min-h-0 overflow-hidden"
              initial={false}
              animate={{
                maxHeight: selectedConversation ? 'calc(100vh - 8rem)' : 'calc(100vh - 20rem)'
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.4)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'
              }}
            >
              {!selectedConversation && (
                <div className="p-6 flex-shrink-0">
                  <h3 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <MessageSquare className="h-4 w-4" />
                    Conversations
                    {serviceConversations.length > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isDark ? 'bg-blue-500 opacity-30 text-blue-300' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {serviceConversations.length}
                      </span>
                    )}
                  </h3>
                </div>
              )}
              
              <AnimatePresence mode="wait">
                {selectedConversation ? (
                  <motion.div
                    key="conversation-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex-1 flex flex-col min-h-0 px-6 pb-6"
                  >
                    <ConversationMessagesView
                      isDark={isDark}
                      selectedConversation={selectedConversation}
                      messages={messages}
                      newMessage={newMessage}
                      setNewMessage={setNewMessage}
                      attachments={attachments}
                      setAttachments={setAttachments}
                      sending={sending}
                      isTyping={isTyping}
                      setIsTyping={setIsTyping}
                      clientIsLive={clientIsLive}
                      partnerIsLive={partnerIsLive}
                      partnerIsTyping={partnerIsTyping}
                      streamingMessage={streamingMessage}
                      messagesEndRef={messagesEndRef}
                      messagesContainerRef={messagesContainerRef}
                      sendMessage={sendMessage}
                      conversationLoading={conversationLoading}
                      conversationError={conversationError}
                      textareaRef={textareaRef}
                      adjustTextareaHeight={adjustTextareaHeight}
                      onClose={() => handleConversationClick(null)}
                      isPartner={isPartner}
                      onFileUpload={onFileUpload}
                      onRequestPhoneAccess={onRequestPhoneAccess}
                      onRequestUpdate={onRequestUpdate}
                      partnerPhone={partnerPhone}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="list-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex flex-col min-h-0 px-6 pb-6"
                  >
                    <ServiceConversationsList
                      isDark={isDark}
                      conversations={serviceConversations}
                      selectedConversation={selectedConversation}
                      fetchConversation={handleConversationClick}
                      getServiceTypeColor={getServiceTypeColor}
                      getServiceColors={getServiceColors}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              duration: 0.5, 
              delay: 0.3,
              ease: "easeOut" 
            }}
            className={`about-devello-glass rounded-3xl p-8 text-center ${isDark ? 'bg-white opacity-5' : 'bg-white opacity-40'}`}
          >
            {EmptyStateIcon && (
              <EmptyStateIcon className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-white opacity-40' : 'text-gray-400'}`} />
            )}
            <p className={isDark ? 'text-white opacity-60' : 'text-gray-600'}>
              {emptyStateMessage || 'No conversations yet.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

