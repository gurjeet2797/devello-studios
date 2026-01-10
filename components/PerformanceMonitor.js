import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToolStateManager } from './contexts/ToolStateManager';
import { BarChart3, Activity, Memory, Clock, AlertTriangle } from 'lucide-react';

export default function PerformanceMonitor() {
  const { getPerformanceMetrics, getActiveTools } = useToolStateManager();
  const [metrics, setMetrics] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Update metrics every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newMetrics = getPerformanceMetrics();
      setMetrics(newMetrics);
      
      // Auto-hide if no active tools
      setIsVisible(newMetrics.activeToolsCount > 0);
    }, 2000);

    return () => clearInterval(interval);
  }, [getPerformanceMetrics]);

  if (!isVisible || !metrics) return null;

  const getPerformanceColor = (count) => {
    if (count <= 2) return 'text-green-400';
    if (count <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMemoryColor = (usage) => {
    if (usage <= 3) return 'text-green-400';
    if (usage <= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const activeTools = getActiveTools();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-white text-sm font-medium">Performance</span>
              </div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-white/60 hover:text-white/80 transition-colors"
              >
                {showDetails ? '−' : '+'}
              </button>
            </div>

            {/* Basic Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-3 h-3 text-green-400" />
                <span className="text-white text-xs">
                  {metrics.activeToolsCount} active
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Memory className="w-3 h-3 text-blue-400" />
                <span className={`text-xs ${getMemoryColor(metrics.totalMemoryUsage)}`}>
                  {metrics.totalMemoryUsage} tools
                </span>
              </div>
            </div>

            {/* Detailed Metrics */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-white/10 pt-2 mt-2"
                >
                  {/* Active Tools List */}
                  <div className="mb-2">
                    <span className="text-white/60 text-xs">Active Tools:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeTools.map((toolId) => (
                        <span
                          key={toolId}
                          className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded"
                        >
                          {toolId}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Performance Warnings */}
                  {metrics.activeToolsCount > 4 && (
                    <div className="flex items-center space-x-2 text-yellow-400 text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      <span>High tool count may affect performance</span>
                    </div>
                  )}

                  {metrics.totalMemoryUsage > 6 && (
                    <div className="flex items-center space-x-2 text-red-400 text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Consider closing unused tools</span>
                    </div>
                  )}

                  {/* Time Metrics */}
                  <div className="flex items-center space-x-2 text-white/60 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>Oldest: {formatTime(metrics.oldestActivity)}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
