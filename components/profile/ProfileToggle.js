import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../Layout';
import { ShoppingBag, Palette } from 'lucide-react';

/**
 * Glass-style toggle switch for switching between Main Profile and Studios Profile
 * @param {string} activeTab - Current active tab ('main' | 'studios')
 * @param {function} onTabChange - Callback when tab changes
 */
export default function ProfileToggle({ activeTab, onTabChange }) {
  const { isDark } = useTheme();

  const tabs = [
    { id: 'main', label: 'Store Profile', icon: ShoppingBag },
    { id: 'studios', label: 'Studios Profile', icon: Palette }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="flex justify-center mb-8"
    >
      <div
        className="about-devello-glass inline-flex rounded-full p-1.5 border"
        style={{
          backdropFilter: 'blur(12px) saturate(150%)',
          WebkitBackdropFilter: 'blur(12px) saturate(150%)',
          backgroundColor: isDark 
            ? 'rgba(255, 255, 255, 0.08)' 
            : 'rgba(255, 255, 255, 0.5)',
          borderColor: isDark 
            ? 'rgba(255, 255, 255, 0.15)' 
            : 'rgba(0, 0, 0, 0.08)',
          borderWidth: '1px'
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileHover={{ scale: isActive ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative px-5 py-2.5 rounded-full text-sm font-medium
                transition-all duration-300 ease-out
                flex items-center gap-2
              `}
              style={{
                backgroundColor: isActive
                  ? isDark 
                    ? 'rgba(255, 255, 255, 0.18)' 
                    : 'rgba(255, 255, 255, 0.9)'
                  : 'transparent',
                color: isActive
                  ? isDark ? '#ffffff' : '#111827'
                  : isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                boxShadow: isActive
                  ? isDark
                    ? '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                  : 'none'
              }}
            >
              <Icon 
                size={16} 
                className={`transition-colors duration-300 ${
                  isActive 
                    ? isDark ? 'text-white' : 'text-gray-900'
                    : isDark ? 'text-white/50' : 'text-gray-400'
                }`}
              />
              <span>{tab.label}</span>
              
              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{
                    backgroundColor: isDark 
                      ? 'rgba(255, 255, 255, 0.6)' 
                      : 'rgba(0, 0, 0, 0.3)'
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

