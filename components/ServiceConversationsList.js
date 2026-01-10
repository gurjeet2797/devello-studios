import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

function getServiceTagText(serviceType) {
  if (!serviceType) return 'Service';
  const normalizedType = serviceType.toLowerCase();
  if (normalizedType.includes('construction')) return 'Construction';
  if (normalizedType.includes('software') || normalizedType.includes('software_dev')) return 'Software Development';
  if (normalizedType.includes('consulting')) return 'Business Consulting';
  if (normalizedType.includes('manufacturing')) return 'Manufacturing';
  return 'Service';
}

export default function ServiceConversationsList({ 
  isDark, 
  conversations, 
  selectedConversation, 
  fetchConversation, 
  getServiceTypeColor, 
  getServiceColors 
}) {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center py-8 flex-1 flex flex-col items-center justify-center min-h-0">
        <MessageSquare className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-white opacity-30' : 'text-gray-400'}`} />
        <p className={`text-sm ${isDark ? 'text-white opacity-70' : 'text-gray-600'}`}>
          No conversations yet.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="space-y-2 flex-1 overflow-y-auto min-h-0 overflow-x-hidden max-h-[600px] pt-2 px-2">
        {conversations.map((conv) => {
          const isSelected = selectedConversation?.id === conv.id;
          const unreadCount = conv.unreadCount || 0;
          const hasUnread = unreadCount > 0;
          return (
            <motion.button
              key={conv.id}
              onClick={() => fetchConversation(conv.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left rounded-xl border p-3 transition-all duration-200 ${
                isSelected
                  ? 'border-2'
                  : ''
              }`}
              style={isSelected ? {
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                borderColor: isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.3)'
              } : (hasUnread ? {
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.12)',
                borderColor: isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.3)'
              } : {
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.1)',
                borderColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.25)'
              })}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`font-medium text-sm truncate ${
                    isSelected 
                      ? isDark ? 'text-green-200' : 'text-green-700'
                      : isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {getServiceTagText(conv.partner?.serviceType)}
                  </div>
                  {hasUnread && !isSelected && (
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                      isDark ? 'bg-green-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className={`text-xs flex-shrink-0 ${
                  isSelected 
                    ? isDark ? 'text-green-200 opacity-80' : 'text-green-700 opacity-80'
                    : isDark ? 'text-white opacity-70' : 'text-gray-600'
                }`}>
                  {new Date(conv.lastMessageAt || conv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className={`text-xs mb-2 truncate ${
                isSelected 
                  ? isDark ? 'text-green-200 opacity-90' : 'text-green-700 opacity-90'
                  : isDark ? 'text-white opacity-80' : 'text-gray-700'
              }`}>
                {conv.partner?.companyName || 'Unknown Company'}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

