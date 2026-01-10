import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Image as ImageIcon, Trash2, Edit3 } from 'lucide-react';

const HotspotContainer = ({ 
  hotspots = [], 
  onHotspotSelect,
  onHotspotRemove,
  onHotspotEdit,
  selectedHotspot = null
}) => {
  const [draggedImage, setDraggedImage] = useState(null);

  const handleHotspotClick = useCallback((hotspot) => {
    if (onHotspotSelect) {
      onHotspotSelect(hotspot);
    }
  }, [onHotspotSelect]);

  const handleHotspotRemove = useCallback((hotspotId, e) => {
    e.stopPropagation();
    if (onHotspotRemove) {
      onHotspotRemove(hotspotId);
    }
  }, [onHotspotRemove]);

  const handleHotspotEdit = useCallback((hotspot, e) => {
    e.stopPropagation();
    if (onHotspotEdit) {
      onHotspotEdit(hotspot);
    }
  }, [onHotspotEdit]);

  const handleDragStart = useCallback((e, imageData) => {
    setDraggedImage(imageData);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedImage(null);
  }, []);

  const handleDrop = useCallback((e, hotspot) => {
    e.preventDefault();
    if (draggedImage && onHotspotSelect) {
      // Assign the dragged image to the hotspot
      onHotspotSelect(hotspot, draggedImage);
    }
    setDraggedImage(null);
  }, [draggedImage, onHotspotSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full h-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-3 flex flex-col"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Hotspots</h3>
          <p className="text-xs text-gray-400">Manage your edit points</p>
        </div>
        <div className="text-xs text-gray-500">
          {hotspots.length} hotspot{hotspots.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {hotspots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center mb-2">
              <Plus size={16} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 mb-1">No hotspots yet</p>
            <p className="text-xs text-gray-500">Click on your image to create hotspots</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {hotspots.map((hotspot, index) => (
              <motion.div
                key={hotspot.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`relative group cursor-pointer rounded-lg overflow-hidden border transition-all duration-200 ${
                  selectedHotspot?.id === hotspot.id 
                    ? 'border-teal-500 bg-teal-500/10' 
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
                onClick={() => handleHotspotClick(hotspot)}
                onDrop={(e) => handleDrop(e, hotspot)}
                onDragOver={handleDragOver}
              >
                {/* Hotspot header - compact */}
                <div className="p-2 bg-zinc-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {hotspot.id}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">Hotspot {hotspot.id}</p>
                        <p className="text-xs text-gray-400">({hotspot.x}%, {hotspot.y}%)</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleHotspotEdit(hotspot, e)}
                        className="p-1 hover:bg-zinc-700 rounded transition-colors"
                        title="Edit hotspot"
                      >
                        <Edit3 size={12} className="text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => handleHotspotRemove(hotspot.id, e)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        title="Remove hotspot"
                      >
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reference images - compact */}
                <div className="p-2">
                  {hotspot.referenceImages && hotspot.referenceImages.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400">Reference images:</p>
                      <div className="grid grid-cols-2 gap-1">
                        {hotspot.referenceImages.map((refImage, refIndex) => (
                          <div
                            key={refImage.id || refIndex}
                            className="relative aspect-square rounded overflow-hidden border border-zinc-600"
                            draggable
                            onDragStart={(e) => handleDragStart(e, refImage)}
                            onDragEnd={handleDragEnd}
                          >
                            <img
                              src={refImage.preview || refImage.url}
                              alt={refImage.name || `Reference ${refIndex + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <X size={8} className="text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-center">
                      <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center mb-1">
                        <ImageIcon size={12} className="text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-400">No reference images</p>
                      <p className="text-xs text-gray-500">Drag images here</p>
                    </div>
                  )}
                </div>

                {/* Drop zone indicator */}
                {draggedImage && (
                  <div className="absolute inset-0 bg-teal-500/20 border-2 border-dashed border-teal-500 rounded-lg flex items-center justify-center">
                    <div className="text-teal-400 text-xs font-medium">Drop to assign</div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </motion.div>
  );
};

export default HotspotContainer;
