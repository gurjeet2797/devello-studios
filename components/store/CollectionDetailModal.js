"use client"

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowRight, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/router';
import { useTheme } from '../Layout';
import { MeshGradient } from "@paper-design/shaders-react";
import Image from 'next/image';
import { updateStatusBar } from '../../lib/useStatusBar';

// Collection content data
const collectionContent = {
  'millwork': {
    title: 'Custom Millwork',
    subtitle: 'Handcrafted Excellence',
    description: 'Transform your space with bespoke millwork that marries traditional craftsmanship with contemporary design. From custom cabinetry to intricate trim work, each piece is artfully created to elevate your home.',
    image: 'https://static.wixstatic.com/media/c6bfe7_02e6fc33ca1e4a42bdc18f557fe4572a~mv2.png',
    images: [
      'https://static.wixstatic.com/media/c6bfe7_ed39ea0bb75842138a082a4703dee087~mv2.png',
      'https://static.wixstatic.com/media/c6bfe7_99be604052314ef081fb255f56758a98~mv2.png'
    ],
    process: [
      {
        step: 1,
        title: 'Consultation & Design',
        description: 'We start with a detailed consultation to understand your vision, space requirements, and style preferences. Our team creates bespoke design drawings and 3D renderings.'
      },
      {
        step: 2,
        title: 'Material Selection',
        description: 'Choose from premium hardwoods, engineered materials, and specialty finishes. We guide you through exquisite options that match your aesthetic and budget.'
      },
      {
        step: 3,
        title: 'Precision Fabrication',
        description: 'Our skilled artisans use traditional techniques and modern tools to create your custom pieces with meticulous attention to detail and quality.'
      },
      {
        step: 4,
        title: 'Finishing & Installation',
        description: 'Each piece receives careful finishing with stains, paints, or clear coats. Our team handles professional installation to ensure perfect fit and finish.'
      }
    ],
    benefits: [
      'Perfect fit for your unique space',
      'Premium materials and craftsmanship',
      'Custom design tailored to your style',
      'Increased property value',
      'Long-lasting quality and durability'
    ],
    examples: [
      'Custom kitchen cabinetry',
      'Built-in shelving and storage',
      'Wooden Vanity, custom cabinets, and more',
      'Custom doors and frames',
      'Entertainment centers',
      'Wainscoting and paneling'
    ],
    materials: ['Hardwood (Oak, Maple, Cherry)', 'Engineered Wood', 'MDF & Plywood', 'Exotic Woods', 'Reclaimed Wood'],
    timeline: '4-8 weeks typical'
  },
  'windows-doors': {
    title: 'Windows & Doors',
    subtitle: 'Precision Engineered, Built to Order',
    description: 'Upgrade your home with premium windows and doors that enhance energy efficiency, natural light, and architectural beauty. We offer custom solutions for every opening.',
    image: 'https://static.wixstatic.com/media/c6bfe7_340f3a0a8afe49938562711c6c0687a2~mv2.jpg',
    images: [
      'https://static.wixstatic.com/media/c6bfe7_e6acc56cc43446e9801554a4c70b85ee~mv2.png',
      'https://static.wixstatic.com/media/c6bfe7_b2109849c1f8473eb1acf64c8f068fc3~mv2.png'
    ],
    process: [
      {
        step: 1,
        title: 'Site Assessment',
        description: 'We measure your existing openings and assess your home\'s architectural style, energy needs, and local building codes to recommend the best solutions.'
      },
      {
        step: 2,
        title: 'Product Selection',
        description: 'Choose from our range of premium energy-efficient windows and doors. Options include double/triple pane glass, various frame materials, and custom sizes.'
      },
      {
        step: 3,
        title: 'Custom Manufacturing',
        description: 'Your windows and doors are artfully manufactured to exact specifications, ensuring perfect fit and optimal performance for your specific climate and needs.'
      },
      {
        step: 4,
        title: 'Professional Installation',
        description: 'Our certified installers ensure proper fitting, sealing, and weatherproofing. We handle everything from removal to cleanup, leaving you with a finished product.'
      }
    ],
    benefits: [
      'Improved energy efficiency',
      'Reduced heating and cooling costs',
      'Enhanced natural light',
      'Better noise reduction',
      'Increased home security',
      'Boosted curb appeal'
    ],
    examples: [
      'Casement and double-hung windows',
      'Bay and bow windows',
      'French and sliding doors',
      'Custom entry doors',
      'Patio and garden doors',
      'Skylights and transoms'
    ],
    materials: ['Vinyl', 'Wood', 'Fiberglass', 'Aluminum', 'Composite'],
    timeline: '2-6 weeks typical'
  },
  'glass-mirrors': {
    title: 'Glass & Mirrors',
    subtitle: 'Crystal Clear Craftsmanship',
    description: 'Create stunning visual impact with custom glass and mirror fabrication. From elegant mirrors to architectural glass features, we deliver precision and beauty.',
    image: 'https://static.wixstatic.com/media/c6bfe7_d12b5ae079854847b38b202aa4101485~mv2.jpg',
    images: [
      'https://static.wixstatic.com/media/c6bfe7_74563e235fa34f39b9d80647afc6e581~mv2.png',
      'https://static.wixstatic.com/media/c6bfe7_33623c9bbf7b413284935dfb70cc1236~mv2.png'
    ],
    process: [
      {
        step: 1,
        title: 'Design Consultation',
        description: 'We discuss your vision, whether it\'s a statement mirror, custom glass partition, or decorative feature. Our team helps refine your ideas into actionable designs.'
      },
      {
        step: 2,
        title: 'Glass Selection',
        description: 'Choose from clear, frosted, tinted, or decorative glass options. We offer various thicknesses, edge treatments, and specialty finishes to match your design.'
      },
      {
        step: 3,
        title: 'Precision Cutting & Fabrication',
        description: 'Using advanced cutting and shaping technology, we create your glass or mirror to exact specifications with perfect edges and custom details.'
      },
      {
        step: 4,
        title: 'Finishing & Installation',
        description: 'Mirrors receive custom framing options, while glass features are finished with edge polishing or decorative treatments. Professional installation ensures secure mounting.'
      }
    ],
    benefits: [
      'Expand visual space',
      'Maximize natural light',
      'Modern aesthetic appeal',
      'Easy maintenance',
      'Custom sizes and shapes',
      'Professional finish quality'
    ],
    examples: [
      'Custom bathroom mirrors',
      'Glass room dividers',
      'Decorative glass panels',
      'Mirrored closet doors',
      'Glass tabletops',
      'Architectural glass features'
    ],
    materials: ['Clear Glass', 'Frosted Glass', 'Tinted Glass', 'Mirrored Glass', 'Decorative Glass', 'Tempered Glass'],
    timeline: '2-4 weeks typical'
  }
};

export default function CollectionDetailModal({ isOpen, onClose, collection, tileRef }) {
  const { isDark } = useTheme();
  const router = useRouter();
  const modalRef = useRef(null);
  const [mounted, setMounted] = React.useState(false);
  const [fullScreenImage, setFullScreenImage] = React.useState(null);

  // Ensure we're mounted (for portal)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (fullScreenImage) {
          setFullScreenImage(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, fullScreenImage]);

  // Disable page scroll and add blur class when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('collection-modal-open');
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('collection-modal-open');
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('collection-modal-open');
    };
  }, [isOpen]);

  // Apply backdrop filter to status bar when modal is open
  useEffect(() => {
    if (isOpen) {
      // Update status bar using centralized utility first
      updateStatusBar(isDark, { isModalOpen: true });
      
      // Match status bar styling to modal backdrop - apply with delays to ensure it persists
      const applyStatusBarBlur = () => {
        const statusBarArea = document.querySelector('.status-bar-area');
        if (statusBarArea) {
          // Force apply backdrop filter
          statusBarArea.style.setProperty('backdrop-filter', 'blur(20px)', 'important');
          statusBarArea.style.setProperty('-webkit-backdrop-filter', 'blur(20px)', 'important');
          statusBarArea.style.setProperty('backdropFilter', 'blur(20px)', 'important');
          statusBarArea.style.setProperty('WebkitBackdropFilter', 'blur(20px)', 'important');
          statusBarArea.style.setProperty('webkitBackdropFilter', 'blur(20px)', 'important');
          statusBarArea.style.backgroundColor = 'transparent';
          statusBarArea.style.background = 'transparent';
          statusBarArea.style.zIndex = '9998';
          // Height is handled by CSS class - matches homepage behavior
          // CSS will use env(safe-area-inset-top) directly, no minimum
          statusBarArea.classList.add('collection-modal-status-bar');
          
          // Debug log
          if (process.env.NODE_ENV !== 'production') {
            console.log('Status bar blur applied:', {
              backdropFilter: statusBarArea.style.backdropFilter,
              zIndex: statusBarArea.style.zIndex,
              height: statusBarArea.offsetHeight,
              display: window.getComputedStyle(statusBarArea).display
            });
          }
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Status bar area element not found');
          }
        }
      };
      
      // Apply immediately and with delays
      applyStatusBarBlur();
      setTimeout(applyStatusBarBlur, 10);
      setTimeout(applyStatusBarBlur, 50);
      setTimeout(applyStatusBarBlur, 100);
      
      // Use MutationObserver to ensure our styles persist
      const observer = new MutationObserver(() => {
        const statusBarArea = document.querySelector('.status-bar-area');
        if (statusBarArea && statusBarArea.classList.contains('collection-modal-status-bar')) {
          const currentBlur = statusBarArea.style.backdropFilter || 
                             statusBarArea.style.getPropertyValue('backdrop-filter');
          if (!currentBlur || !currentBlur.includes('blur')) {
            applyStatusBarBlur();
          }
        }
      });
      
      const statusBarArea = document.querySelector('.status-bar-area');
      if (statusBarArea) {
        observer.observe(statusBarArea, {
          attributes: true,
          attributeFilter: ['style', 'class']
        });
      }
      
      return () => {
        observer.disconnect();
        updateStatusBar(isDark, { isModalOpen: false });
        const statusBarArea = document.querySelector('.status-bar-area');
        if (statusBarArea) {
          statusBarArea.style.zIndex = '';
          statusBarArea.classList.remove('collection-modal-status-bar');
        }
      };
    } else {
      // Restore status bar to normal state
      updateStatusBar(isDark, { isModalOpen: false });
      
      // Reset status bar styling
      const statusBarArea = document.querySelector('.status-bar-area');
      if (statusBarArea) {
        statusBarArea.style.zIndex = '';
        statusBarArea.classList.remove('collection-modal-status-bar');
      }
    }
  }, [isOpen, isDark]);

  if (!collection || !collectionContent[collection.id] || !mounted) {
    return null;
  }

  const content = collectionContent[collection.id];

  const modalContent = (
    <>
      {/* Full Screen Image Viewer */}
      <AnimatePresence>
        {fullScreenImage && (() => {
          const allImages = content.images && content.images.length > 0 
            ? content.images 
            : [content.image];
          const currentIndex = allImages.findIndex(img => img === fullScreenImage);
          const hasMultipleImages = allImages.length > 1;
          
          const handleNextImage = (e) => {
            e.stopPropagation();
            if (currentIndex < allImages.length - 1) {
              setFullScreenImage(allImages[currentIndex + 1]);
            } else {
              setFullScreenImage(allImages[0]);
            }
          };
          
          const handlePrevImage = (e) => {
            e.stopPropagation();
            if (currentIndex > 0) {
              setFullScreenImage(allImages[currentIndex - 1]);
            } else {
              setFullScreenImage(allImages[allImages.length - 1]);
            }
          };
          
          return (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[100000] flex items-center justify-center px-2 sm:px-4"
                onClick={() => setFullScreenImage(null)}
              style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    layout: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
                    opacity: { duration: 0.3 }
                  }}
                onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-6xl max-h-[90vh] flex flex-col"
                >
                  {/* Glass Container - Only around image */}
                  <motion.div
                    layout
                    className="relative w-auto max-w-full flex items-center justify-center overflow-hidden rounded-3xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      layout: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
                      opacity: { duration: 0.3 }
                    }}
                    style={{
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      backgroundColor: isDark 
                        ? 'rgba(255, 255, 255, 0.15)' 
                        : 'rgba(255, 255, 255, 0.8)',
                      border: isDark
                        ? '1px solid rgba(255, 255, 255, 0.25)'
                        : '1px solid rgba(0, 0, 0, 0.1)',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {/* Close Button */}
                <button
                  onClick={() => setFullScreenImage(null)}
                      className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 text-white"
                  style={{
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <X className="w-5 h-5" />
                </button>

                    {/* Main Image */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentIndex}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ 
                          duration: 0.4,
                          ease: [0.4, 0, 0.2, 1],
                          layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                        }}
                        className="relative"
                      >
                        <Image
                          src={fullScreenImage}
                          alt={content.title}
                          width={1600}
                          height={1200}
                          className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain"
                          sizes="(max-width: 768px) 90vw, (max-width: 1200px) 80vw, 1200px"
                          priority
                        />
                      </motion.div>
                    </AnimatePresence>

                    {/* Navigation Arrows */}
                    {hasMultipleImages && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 text-white z-10"
                          style={{
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 text-white z-10"
                          style={{
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}
                  </motion.div>

                  {/* Image Indicators - Outside glass container */}
                  {hasMultipleImages && (
                    <div className="mt-4 flex justify-center gap-2">
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullScreenImage(allImages[index]);
                          }}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            index === currentIndex
                              ? 'bg-white w-8'
                              : 'bg-white/40 hover:bg-white/60 w-2'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Title - Outside glass container */}
                  <div className="mt-4 text-center">
                    <h3 className={`text-lg sm:text-xl font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {content.title}
                    </h3>
                  </div>
              </motion.div>
            </motion.div>
          </>
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
          {/* Modal Container - fixed viewport height, content scrollable */}
          <motion.div
            initial={{ zIndex: 99999 }}
            animate={{ zIndex: 99999 }}
            exit={{ zIndex: 99999 }}
            className="collection-modal-container fixed inset-0 z-[10000] flex items-center justify-center px-2 sm:px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
            style={{
              overflow: 'hidden',
              touchAction: 'none',
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: '0',
              marginBottom: '0',
              backgroundColor: 'transparent',
              background: 'transparent',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              height: '100vh',
              height: '100dvh',
              width: '100%',
              position: 'fixed'
            }}
          >
            <motion.div
              ref={modalRef}
              layoutId={`collection-tile-${collection.id}`}
              initial={{
                scale: 0.85,
                opacity: 0,
                y: 20
              }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0
              }}
              exit={{
                scale: 0.9,
                opacity: 0,
                y: 10
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8
              }}
              layout={false}
              onClick={(e) => e.stopPropagation()}
              className="about-devello-glass build-button-gradient collection-modal-content relative flex flex-col w-[95vw] sm:w-[90vw] md:w-[85vw] lg:max-w-5xl transform-gpu will-change-transform backdrop-blur-md scrollbar-hide"
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: isDark
                  ? 'rgba(0, 0, 0, 0.4)'
                  : 'rgba(255, 255, 255, 0.6)',
                borderRadius: '2rem',
                zIndex: 99999,
                position: 'relative',
                maxHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 4rem)',
                overflow: 'hidden'
              }}
            >
              {/* Mesh Gradient Background */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ 
                  opacity: {
                    duration: 0.2,
                    ease: [0.16, 1, 0.3, 1]
                  }
                }}
                className="absolute inset-0 pointer-events-none overflow-hidden"
                style={{
                  borderRadius: 'inherit'
                }}
              >
                <MeshGradient
                  speed={1}
                  colors={isDark
                    ? ["#000000", "#1a1a1a", "#2a2a2a", "#3a3a3a", "#c0c0c0"]
                    : ["#fef3c7", "#fef9e7", "#ffffff", "#ffffff", "#ffffff"]
                  }
                  distortion={0.8}
                  swirl={0.1}
                  grainMixer={0}
                  grainOverlay={0}
                  className="inset-0"
                  style={{
                    height: "100%",
                    width: "100%",
                    opacity: isDark ? 0.5 : 0.4,
                    borderRadius: "inherit"
                  }}
                />
              </motion.div>

              {/* Close Button - Fixed position */}
              <div className="relative z-50 flex-shrink-0 pt-4 pr-4 flex justify-end">
                <motion.button
                  whileTap={{ 
                    scale: 0.85,
                    transition: { 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 25 
                    }
                  }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 text-white"
                  style={{
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Content - scrollable area */}
              <div className="relative z-10 p-4 sm:p-6 md:p-8 pt-0 pb-12 sm:pb-12 md:pb-12 overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 12rem)' }}>
                {/* Title */}
                <h2 className={`text-2xl sm:text-3xl font-light mb-6 text-center ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {content.title}
                </h2>

                {/* Header Images - 2 Column Grid */}
                <div 
                  className="relative w-full max-w-5xl mx-auto mb-6 overflow-hidden" 
                  style={{ borderRadius: '2rem' }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center mt-0 mb-0">
                    <div 
                      className="relative w-full cursor-pointer flex items-center justify-center"
                      style={{ borderRadius: '1rem', overflow: 'hidden', aspectRatio: 'auto', minHeight: '200px' }}
                      onClick={() => setFullScreenImage(content.images?.[0] || content.image)}
                    >
                      <Image
                        src={content.images?.[0] || content.image}
                        alt={content.title}
                        width={800}
                        height={600}
                        className="object-contain w-full h-auto max-h-full"
                        style={{ borderRadius: 'inherit' }}
                        sizes="(max-width: 768px) 50vw, 40vw"
                      />
                    </div>
                    <div 
                      className="relative w-full cursor-pointer flex items-center justify-center"
                      style={{ borderRadius: '1rem', overflow: 'hidden', aspectRatio: 'auto', minHeight: '200px' }}
                      onClick={() => {
                        if (collection.id === 'windows-doors') {
                          onClose();
                          router.push('/storecatalogue?category=doors');
                        } else {
                          setFullScreenImage(content.images?.[1] || content.image);
                        }
                      }}
                    >
                      <Image
                        src={content.images?.[1] || content.image}
                        alt={content.title}
                        width={800}
                        height={600}
                        className="object-contain w-full h-auto max-h-full"
                        style={{ borderRadius: 'inherit' }}
                        sizes="(max-width: 768px) 50vw, 40vw"
                      />
                    </div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="space-y-4 pr-2">
                  <p className={`text-sm leading-relaxed ${
                    isDark ? 'text-white/90' : 'text-gray-700'
                  }`}>
                    {content.description}
                  </p>

                  {/* Compact Benefits & Examples */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className={`text-sm font-medium mb-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        Benefits
                      </h3>
                      <ul className="space-y-1.5">
                        {content.benefits.slice(0, 3).map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className={`flex-shrink-0 w-4 h-4 mt-0.5 ${
                              isDark ? 'text-emerald-400' : 'text-emerald-600'
                            }`} />
                            <span className={`text-xs ${
                              isDark ? 'text-white/80' : 'text-gray-700'
                            }`}>
                              {benefit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className={`text-sm font-medium mb-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        Examples
                      </h3>
                      <ul className="space-y-1.5">
                        {content.examples.slice(0, 3).map((example, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Star className={`flex-shrink-0 w-4 h-4 mt-0.5 ${
                              isDark ? 'text-amber-400' : 'text-amber-600'
                            }`} />
                            <span className={`text-xs ${
                              isDark ? 'text-white/80' : 'text-gray-700'
                            }`}>
                              {example}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Materials */}
                  <div>
                    <h3 className={`text-sm font-medium mb-2 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Materials
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {content.materials.slice(0, 4).map((material, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 rounded-full text-xs ${
                            isDark
                              ? 'bg-white/10 text-white/80 border border-white/20'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="w-full pt-4 border-t border-white/10 flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (collection.id === 'windows-doors') {
                          onClose();
                          router.push('/storecatalogue?category=windows');
                        } else if (collection.id === 'millwork') {
                          // Close modal first
                          onClose();
                          // Wait for modal close animation before scrolling and opening form
                          setTimeout(() => {
                            // First, scroll smoothly to top
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            
                            if (router.pathname === '/custom') {
                              // Already on custom page - find and click the BuildButton
                              setTimeout(() => {
                                // Try multiple ways to find the button
                                const findAndClickButton = () => {
                                  // Method 1: Find by data attribute (most reliable)
                                  const buildButtonByData = document.querySelector('button[data-build-button="true"]');
                                  if (buildButtonByData && !buildButtonByData.disabled) {
                                    buildButtonByData.click();
                                    return true;
                                  }
                                  
                                  // Method 2: Find button by text content
                                  const buttons = Array.from(document.querySelectorAll('button'));
                                  const buildButton = buttons.find(btn => {
                                    const text = btn.textContent?.toLowerCase() || '';
                                    return (text.includes('create custom product') || text.includes('start my order')) && !btn.disabled;
                                  });
                                  
                                  if (buildButton) {
                                    buildButton.click();
                                    return true;
                                  }
                                  
                                  // Method 3: Find by class that contains build-button
                                  const buildButtonByClass = document.querySelector('button.about-devello-glass.build-button-gradient');
                                  if (buildButtonByClass && !buildButtonByClass.disabled) {
                                    buildButtonByClass.click();
                                    return true;
                                  }
                                  
                                  // Method 4: Dispatch custom event as fallback
                                  window.dispatchEvent(new CustomEvent('openCustomForm'));
                                  return false;
                                };
                                
                                findAndClickButton();
                              }, 600); // Wait for scroll to start
                            } else {
                              // Navigate to custom page with hash
                              const handleRouteChange = () => {
                                setTimeout(() => {
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                  // Try to click button after navigation
                                  setTimeout(() => {
                                    // Try data attribute first
                                    const buildButtonByData = document.querySelector('button[data-build-button="true"]');
                                    if (buildButtonByData && !buildButtonByData.disabled) {
                                      buildButtonByData.click();
                                    } else {
                                      // Fallback to text search
                                      const buttons = Array.from(document.querySelectorAll('button'));
                                      const buildButton = buttons.find(btn => {
                                        const text = btn.textContent?.toLowerCase() || '';
                                        return (text.includes('create custom product') || text.includes('start my order')) && !btn.disabled;
                                      });
                                      if (buildButton) {
                                        buildButton.click();
                                      } else {
                                        window.dispatchEvent(new CustomEvent('openCustomForm'));
                                      }
                                    }
                                  }, 700);
                                }, 100);
                                router.events.off('routeChangeComplete', handleRouteChange);
                              };
                              router.events.on('routeChangeComplete', handleRouteChange);
                              router.push('/custom#open-form');
                            }
                          }, 500); // Wait longer for modal close animation
                        } else if (collection.id === 'glass-mirrors') {
                          onClose();
                          router.push('/storecatalogue?category=glass-mirrors');
                        } else {
                          onClose();
                          router.push('/custom');
                        }
                      }}
                      className="w-fit px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-emerald-500/20 text-white border-2 border-emerald-400/50 hover:bg-emerald-500/30"
                    >
                      <span>
                        {collection.id === 'windows-doors' 
                          ? 'Shop Windows' 
                          : collection.id === 'millwork' 
                          ? 'Start Custom Order' 
                          : collection.id === 'glass-mirrors'
                          ? 'Shop Glass products'
                          : 'Upload my design for a quote'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );

  return createPortal(modalContent, document.body);
}

