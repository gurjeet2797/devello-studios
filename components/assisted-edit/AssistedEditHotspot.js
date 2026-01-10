import React, { useRef, useState } from 'react';

const AssistedEditHotspot = ({ 
  hotspot, 
  containerDims, 
  colors = {},
  onClick,
  onRemove,
  onPositionChange,
  onReferenceImageDrop,
  disabled = false
}) => {
  const dotRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleMouseDown = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;

    const containerRect = dotRef.current?.closest('.relative')?.getBoundingClientRect();
    if (!containerRect) return;

    const startHotspotX = hotspot.x;
    const startHotspotY = hotspot.y;

    const handleMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const dxPercent = (dx / containerRect.width) * 100;
      const dyPercent = (dy / containerRect.height) * 100;
      const newX = Math.max(0, Math.min(100, startHotspotX + dxPercent));
      const newY = Math.max(0, Math.min(100, startHotspotY + dyPercent));
      onPositionChange && onPositionChange(hotspot.id, newX, newY);
    };

    const handleUp = (upEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    try {
      const imageData = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (onReferenceImageDrop) {
        onReferenceImageDrop(hotspot.id, imageData);
      }
    } catch (error) {
      console.error('Failed to parse dropped image data:', error);
    }
  };

  return (
    <div
      ref={dotRef}
      className={`absolute z-30 w-16 h-16 sm:w-20 sm:h-20 backdrop-blur-[1px] border-2 border-dashed rounded-lg shadow-lg flex items-center justify-center cursor-pointer transition-all duration-200 ${
        isDragOver ? 'scale-110 border-teal-400 bg-teal-400/20' : ''
      }`}
      style={{
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'transparent',
        borderColor: isDragOver 
          ? '#2DD4BF' 
          : (colors.borderColor || 'rgba(255,255,255,0.5)')
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(hotspot); }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      title={`Hotspot ${hotspot.id} - (${hotspot.x.toFixed(1)}%, ${hotspot.y.toFixed(1)}%)`}
    >
      {/* Reference image background */}
      {hotspot.referenceImages && hotspot.referenceImages.length > 0 ? (
        <div className="w-full h-full rounded-lg overflow-hidden">
          <img
            src={hotspot.referenceImages[0].url || hotspot.referenceImages[0].preview}
            alt={`Reference for hotspot ${hotspot.id}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          {/* Overlay with hotspot number */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span 
              className="text-xs font-bold drop-shadow-lg"
              style={{ color: colors.textColor || 'rgba(255, 255, 255, 0.95)' }}
            >
              {hotspot.id}
            </span>
          </div>
        </div>
      ) : (
        <span 
          className="text-xs drop-shadow-lg"
          style={{ color: colors.textColor || 'rgba(255, 255, 255, 0.95)' }}
        >
          {hotspot.id}
        </span>
      )}

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove && onRemove(hotspot.id); }}
        className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white/90 text-red-500 border border-red-300/50 flex items-center justify-center text-[10px] leading-none"
        title="Remove this edit point"
      >
        <span className="relative" style={{ top: '0px' }}>×</span>
      </button>
    </div>
  );
};

export default AssistedEditHotspot;
