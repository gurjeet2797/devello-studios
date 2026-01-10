"use client"

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, ShoppingCart, Loader2 } from 'lucide-react';
import { useTheme } from '../Layout';
import { ProductService } from '../../lib/productService';
import { useCart } from './CartContext';
import Image from 'next/image';
import { MeshGradient } from "@paper-design/shaders-react";
import {
  ShippingProfileCode,
  isWhiteGloveRecommended,
} from '../../lib/shippingUtils';
import { updateStatusBar } from '../../lib/useStatusBar';

export default function ProductModal({ product, isOpen, onClose, onBuyNow }) {
  const { isDark } = useTheme();
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [dimensionsInput, setDimensionsInput] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dimensionError, setDimensionError] = useState('');
  const [isBuyNowHovered, setIsBuyNowHovered] = useState(false);
  const [wiggleBuyNow, setWiggleBuyNow] = useState(false);
  const [wiggleDimensions, setWiggleDimensions] = useState(false);
  const modalRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Glass/Mirror order form state
  const [orderEmail, setOrderEmail] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderRequirements, setOrderRequirements] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Ensure we're mounted (for portal)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get variants safely (product might be null initially)
  const variants = product ? ProductService.getVariants(product) : [];
  const productId = product ? ProductService.getProductId(product) : null;
  const minPrice = product ? ProductService.getMinPrice(product) : 0;
  const hasVariants = variants.length > 0;

  // Set default variant on mount - prefer Black Aluminum Frame for windows
  useEffect(() => {
    if (isOpen && product && hasVariants && variants.length > 0 && !selectedVariant) {
      // For windows, prefer Black Aluminum Frame variant, otherwise use first variant
      const category = product.metadata?.category;
      if (category === 'windows') {
        const blackVariant = variants.find(v => 
          v.name === 'Black Aluminum Frame' || v.name?.toLowerCase().includes('black')
        );
        setSelectedVariant(blackVariant || variants[0]);
      } else {
        setSelectedVariant(variants[0]);
      }
    }
  }, [isOpen, product, hasVariants, variants, selectedVariant]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedVariant(null);
      setQuantity(1);
      setHeight('');
      setWidth('');
      setDimensionsInput('');
      setOrderEmail('');
      setOrderPhone('');
      setOrderRequirements('');
      setOrderError('');
      setOrderSuccess(false);
      setIsBuyNowHovered(false);
    }
  }, [isOpen]);
  
  // Check if product is glass or mirror
  const isGlassOrMirror = product?.metadata?.category === 'glass' || product?.metadata?.category === 'mirrors';

  // Calculate current price
  const currentPrice = selectedVariant?.price || (product?.price || 0);
  const totalPrice = currentPrice * quantity;

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      addToCart(product, selectedVariant, quantity, height, width);
      // Show success feedback
      setTimeout(() => {
        setIsAddingToCart(false);
        onClose();
      }, 500);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error adding to cart:', error);
      }
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    // Check if dimensions are required (for windows and doors)
    const requiresDimensions = product.metadata?.category === 'windows' || product.metadata?.category === 'doors';
    
    if (requiresDimensions) {
      const heightNum = parseFloat(height);
      const widthNum = parseFloat(width);
      
      if (!height || !width || isNaN(heightNum) || isNaN(widthNum) || heightNum <= 0 || widthNum <= 0) {
        setDimensionError('Please provide valid height and width dimensions before purchasing.');
        
        // Trigger wiggle animation on Buy Now button
        setWiggleBuyNow(true);
        setTimeout(() => setWiggleBuyNow(false), 600);
        
        // Trigger wiggle animation on dimensions field after 0.3s delay
        setTimeout(() => {
          setWiggleDimensions(true);
          setTimeout(() => setWiggleDimensions(false), 600);
        }, 300);
        
        return;
      }
    }
    
    setDimensionError('');
    setIsProcessing(true);
    try {
      await onBuyNow(product, selectedVariant, quantity, height, width);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error in buy now:', error);
      }
      setIsProcessing(false);
    }
  };
  
  const handlePlaceOrder = async () => {
    // Validate form
    if (!orderEmail || !orderEmail.trim()) {
      setOrderError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(orderEmail.trim())) {
      setOrderError('Please enter a valid email address');
      return;
    }
    if (!orderRequirements || !orderRequirements.trim()) {
      setOrderError('Please provide your order requirements');
      return;
    }
    
    setOrderError('');
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/products/glass-mirror-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          email: orderEmail.trim(),
          phone: orderPhone.trim() || null,
          orderRequirements: orderRequirements.trim(),
          quantity,
          height: height || null,
          width: width || null,
          selectedVariant: selectedVariant ? {
            name: selectedVariant.name,
            material: selectedVariant.material
          } : null
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit order');
      }
      
      setOrderSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error placing order:', error);
      }
      setOrderError(error.message || 'Failed to submit order. Please try again.');
      setIsProcessing(false);
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Disable page scroll and add blur class when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('product-modal-open');
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('product-modal-open');
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('product-modal-open');
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
          statusBarArea.classList.add('product-modal-status-bar');
          
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
        if (statusBarArea && statusBarArea.classList.contains('product-modal-status-bar')) {
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
          statusBarArea.classList.remove('product-modal-status-bar');
        }
      };
    } else {
      // Restore status bar to normal state
      updateStatusBar(isDark, { isModalOpen: false });
      
      // Reset status bar styling
      const statusBarArea = document.querySelector('.status-bar-area');
      if (statusBarArea) {
        statusBarArea.style.zIndex = '';
        statusBarArea.classList.remove('product-modal-status-bar');
      }
    }
  }, [isOpen, isDark]);

  // Get image URL - prioritize variant image, use product.image_url for doors, skip cover image for windows
  const getImageUrl = () => {
    if (!product) return '';
    
    // Check if variant has imageUrl (case-insensitive check for property name)
    const variantImageUrl = selectedVariant?.imageUrl || selectedVariant?.image_url;
    if (variantImageUrl) {
      return variantImageUrl;
    }
    
    // For doors, use product.image_url if available (doors should show their cover image)
    const category = product.metadata?.category;
    if (category === 'doors' && product.image_url) {
      return product.image_url;
    }
    
    // For windows, skip product.image_url (cover image) - only use variant images or fallbacks
    // Fallback to slug-based images for windows
    if (product.slug === 'metro-double-hung-window') {
      return 'https://static.wixstatic.com/media/c6bfe7_8cca0ec989e748818b139fd7693a27c5~mv2.webp';
    }
    if (product.slug === 'loft-casement-window') {
      return 'https://static.wixstatic.com/media/c6bfe7_f79f999ed045416d8cf9136bdf200d22~mv2.webp';
    }
    if (product.slug === 'brownstone-bay-picture-set') {
      return 'https://static.wixstatic.com/media/c6bfe7_d7d14237f5024361b78deb2e3366261f~mv2.webp';
    }
    
    // Fallback to category-based images
    const categoryImages = {
      doors: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
      windows: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
      glass: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
      mirrors: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
    };
    
    return categoryImages[category] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop';
  };

  const imageUrl = getImageUrl();

  // Check if dimensions are valid for Buy Now button
  const requiresDimensions = product?.metadata?.category === 'windows' || product?.metadata?.category === 'doors';
  const heightNum = parseFloat(height);
  const widthNum = parseFloat(width);
  const dimensionsValid = !requiresDimensions || (
    height && width && 
    !isNaN(heightNum) && !isNaN(widthNum) && 
    heightNum > 0 && widthNum > 0
  );
  const isBuyNowDisabled = isProcessing || !dimensionsValid;

  // Early return after all hooks - only check product, not isOpen (to allow exit animation)
  if (!product) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <div 
            className="product-modal-container fixed inset-0 z-[10000] flex items-center justify-center px-2 sm:px-4"
            onClick={onClose}
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
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8
              }}
              onClick={(e) => e.stopPropagation()}
              className="about-devello-glass build-button-gradient relative flex flex-col w-[95vw] sm:w-[90vw] md:w-[85vw] lg:max-w-5xl max-h-[82vh] md:max-h-[90vh] transform-gpu will-change-transform scrollbar-hide"
              style={{ 
                borderRadius: "2rem",
                backgroundColor: isDark 
                  ? 'rgba(0, 0, 0, 0.4)'
                  : 'rgba(255, 255, 255, 0.6)'
              }}
            >
              {/* Background Gradient */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: "2rem" }}>
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
                    opacity: isDark ? 0.5 : 0.4
                  }}
                />
              </div>

              {/* Header with Close Button - fixed position, not scrollable */}
              <div className="relative z-50 flex-shrink-0 pt-4 pr-4 flex justify-end">
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full about-devello-glass flex items-center justify-center hover:bg-white/20 transition-colors"
                  style={{ 
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    backgroundColor: isDark 
                      ? 'rgba(0, 0, 0, 0.5)'
                      : 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-black'}`} />
                </button>
              </div>

              {/* Content - scrollable area */}
              <div className="relative z-10 px-6 sm:px-8 md:px-10 pt-1 pb-6 sm:pb-8 md:pb-10 overflow-y-auto flex-1">
                {/* Product Name - Centered above both columns */}
                <h2 className={`text-2xl md:text-3xl font-light mb-6 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {product.name}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* Left Column - Product Image and Variants */}
                  <div className="flex flex-col">
                    {/* Product Image */}
                    <div className="relative w-full rounded-2xl overflow-hidden flex-shrink-0 mb-4">
                      <div className="relative w-full" style={{ aspectRatio: 'auto' }}>
                        <Image
                          key={selectedVariant?.name || 'default'}
                          src={imageUrl}
                          alt={product.name}
                          width={800}
                          height={600}
                          className="object-contain w-full h-auto rounded-2xl"
                          sizes="(max-width: 768px) 100vw, 40vw"
                          style={{ height: 'auto' }}
                        />
                      </div>
                    </div>

                    {/* Product Description - Below image */}
                    {product.description && (
                      <p className={`text-sm md:text-base mb-6 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                        {product.description}
                      </p>
                    )}

                    {/* Variants Selection - Below image in a row */}
                    {hasVariants && (
                      <div className="mb-6">
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Select Material/Variant
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {variants.map((variant) => (
                            <button
                              key={variant.name}
                              onClick={() => setSelectedVariant(variant)}
                              className={`flex-1 min-w-[120px] text-left p-3 rounded-xl transition-all ${
                                selectedVariant?.name === variant.name
                                  ? isDark
                                    ? 'bg-emerald-500/30 border-2 border-emerald-400/50'
                                    : 'bg-emerald-500/20 border-2 border-emerald-400/50'
                                  : isDark
                                    ? 'bg-white/10 border border-white/20 hover:bg-white/20'
                                    : 'bg-white/50 border border-gray-300 hover:bg-white/70'
                              }`}
                            >
                              <div className="flex flex-col">
                                <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {variant.name === 'Black Aluminum Frame' ? 'Black Aluminum' : 
                                   variant.name === 'Dark Bronze' ? 'Dark Bronze' : variant.name}
                                </p>
                                {variant.material && (
                                  <p className={`text-xs mt-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                                    {variant.material}
                                  </p>
                                )}
                                {!isGlassOrMirror && (
                                  <p className={`font-semibold text-sm mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {formatPrice(variant.price)}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-col min-w-0 pt-4">
                    {/* Size Fields with Quantity - Only for windows and doors */}
                    {(product.metadata?.category === 'windows' || product.metadata?.category === 'doors') && (
                      <motion.div 
                        className="mb-6"
                        animate={wiggleDimensions ? {
                          x: [0, -10, 10, -10, 10, 0],
                        } : {}}
                        transition={{
                          duration: 0.6,
                          ease: "easeInOut"
                        }}
                      >
                        <div className="flex items-end gap-4 mb-2">
                          <div className="flex-1">
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Dimensions <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={dimensionsInput}
                              onChange={(e) => {
                                const value = e.target.value;
                                setDimensionsInput(value);
                                setDimensionError('');
                                
                                // Parse format like "32x80" or "32x80, 28x80"
                                // Extract the first dimension pair for validation
                                const parts = value.split(',');
                                if (parts.length > 0) {
                                  const firstPart = parts[0].trim();
                                  const dimensionMatch = firstPart.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
                                  if (dimensionMatch) {
                                    setHeight(dimensionMatch[1]);
                                    setWidth(dimensionMatch[2]);
                                  } else if (value === '') {
                                    setHeight('');
                                    setWidth('');
                                  }
                                }
                              }}
                              placeholder="e.g., 32x80, 28x80"
                              className={`w-full px-4 py-2 rounded-xl border transition-all duration-300 ${
                                dimensionError
                                  ? 'border-red-500'
                                  : (!height || !width) && isBuyNowHovered
                                  ? isDark
                                    ? 'bg-white/10 border-emerald-400/60 text-white placeholder-white/40 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                    : 'bg-white/50 border-emerald-500/60 text-gray-900 placeholder-gray-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                  : isDark
                                  ? 'bg-white/10 border-white/20 text-white placeholder-white/40'
                                  : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'
                              }`}
                            />
                          </div>
                          {!isGlassOrMirror && (
                            <div className="flex items-center gap-2">
                              <label className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Quantity
                              </label>
                              <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  isDark
                                    ? 'bg-white/10 hover:bg-white/20 border border-white/20'
                                    : 'bg-white/50 hover:bg-white/70 border border-gray-300'
                                }`}
                              >
                                <span className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>−</span>
                              </button>
                              <span className={`text-xl font-medium w-12 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {quantity}
                              </span>
                              <button
                                onClick={() => setQuantity(quantity + 1)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  isDark
                                    ? 'bg-white/10 hover:bg-white/20 border border-white/20'
                                    : 'bg-white/50 hover:bg-white/70 border border-gray-300'
                                }`}
                              >
                                <span className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>+</span>
                              </button>
                            </div>
                          )}
                        </div>
                        {dimensionError && (
                          <p className="text-red-500 text-xs mt-2">{dimensionError}</p>
                        )}
                        {isBuyNowHovered && (!height || !width) && !dimensionError && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className={`text-xs mt-2 italic ${
                              isDark ? 'text-emerald-300/80' : 'text-emerald-600/80'
                            }`}
                          >
                            Please enter dimensions to proceed
                          </motion.p>
                        )}
                      </motion.div>
                    )}

                    {/* Quantity Selector - Only for glass/mirror (when dimensions not shown) */}
                    {isGlassOrMirror && (product.metadata?.category !== 'windows' && product.metadata?.category !== 'doors') && (
                      <div className="mb-6">
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Quantity
                        </label>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isDark
                                ? 'bg-white/10 hover:bg-white/20 border border-white/20'
                                : 'bg-white/50 hover:bg-white/70 border border-gray-300'
                            }`}
                          >
                            <span className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>−</span>
                          </button>
                          <span className={`text-xl font-medium w-12 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {quantity}
                          </span>
                          <button
                            onClick={() => setQuantity(quantity + 1)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isDark
                                ? 'bg-white/10 hover:bg-white/20 border border-white/20'
                                : 'bg-white/50 hover:bg-white/70 border border-gray-300'
                            }`}
                          >
                            <span className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>+</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Price Display - One liner */}
                    {!isGlassOrMirror && (
                      <div className="mb-6 p-3 rounded-xl about-devello-glass">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                            {quantity > 1 ? `$${(currentPrice / 100).toFixed(2)} × ${quantity}` : 'Price'}
                          </span>
                          <span className={`text-xl md:text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatPrice(totalPrice)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Glass/Mirror Order Form */}
                    {isGlassOrMirror && (
                      <>
                        <div className={`mb-6 p-3 rounded-xl border ${
                          isDark
                            ? 'bg-white/5 border-white/10'
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <p className={`text-xs ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                            Custom pricing available. Submit your order requirements and we will generate your custom price within 2 days.
                          </p>
                        </div>
                        
                        <div className="mb-6">
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            value={orderEmail}
                            onChange={(e) => {
                              setOrderEmail(e.target.value);
                              setOrderError('');
                            }}
                            placeholder="your@email.com"
                            className={`w-full px-3 py-2 rounded-xl border text-sm ${
                              orderError && !orderEmail
                                ? 'border-red-500'
                                : isDark
                                ? 'bg-white/10 border-white/20 text-white placeholder-white/40'
                                : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'
                            }`}
                          />
                        </div>
                        
                        <div className="mb-6">
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Phone (Optional)
                          </label>
                          <input
                            type="tel"
                            value={orderPhone}
                            onChange={(e) => setOrderPhone(e.target.value)}
                            placeholder="929-266-2966"
                            className={`w-full px-3 py-2 rounded-xl border text-sm ${
                              isDark
                                ? 'bg-white/10 border-white/20 text-white placeholder-white/40'
                                : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'
                            }`}
                          />
                          <p className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                            For quick reach back by Devello
                          </p>
                        </div>
                        
                        <div className="mb-6">
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Order Requirements <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={orderRequirements}
                            onChange={(e) => {
                              setOrderRequirements(e.target.value);
                              setOrderError('');
                            }}
                            placeholder="Please describe your order requirements, dimensions, quantity, and any special requests..."
                            rows={3}
                            className={`w-full px-3 py-2 rounded-xl border text-sm ${
                              orderError && !orderRequirements
                                ? 'border-red-500'
                                : isDark
                                ? 'bg-white/10 border-white/20 text-white placeholder-white/40'
                                : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'
                            }`}
                          />
                        </div>
                        
                        {/* Shipping Information for Glass/Mirror - inline */}
                        <div className={`mb-6 p-3 rounded-xl border ${
                          isDark
                            ? 'bg-white/5 border-white/10'
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <p className={`text-xs ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                            Shipping to NYC only
                          </p>
                        </div>
                        
                        {orderError && (
                          <div className="mb-3 p-2 rounded-xl bg-red-500/20 border border-red-500/50">
                            <p className="text-red-500 text-xs">{orderError}</p>
                          </div>
                        )}
                        
                        {orderSuccess && (
                          <div className="mb-3 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50">
                            <p className={`text-emerald-600 ${isDark ? 'text-emerald-400' : 'text-emerald-700'} text-xs`}>
                              Order submitted successfully! We will contact you within 2 days with a custom price.
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Shipping Information - Only for non-glass/mirror products */}
                    {!isGlassOrMirror && (
                      <div className={`mb-6 p-3 rounded-xl border ${
                        isDark
                          ? 'bg-white/5 border-white/10'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <p className={`text-xs ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                          Shipping to NYC only
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {isGlassOrMirror ? (
                      <button
                        onClick={handlePlaceOrder}
                        disabled={isProcessing || orderSuccess}
                        className={`w-full px-6 py-3 rounded-full font-medium transition-all flex items-center justify-center gap-2 ${
                          isDark
                            ? 'bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-400/50'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600'
                        } ${(isProcessing || orderSuccess) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : orderSuccess ? (
                          'Order Submitted!'
                        ) : (
                          'Place Order'
                        )}
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={handleAddToCart}
                          disabled={isAddingToCart}
                          className={`flex-1 px-6 py-3 rounded-full font-medium transition-all flex items-center justify-center gap-2 ${
                            isDark
                              ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                              : 'bg-gray-900 hover:bg-gray-800 text-white border border-gray-800'
                          } ${isAddingToCart ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isAddingToCart ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" />
                              Add to Cart
                            </>
                          )}
                        </button>
                        <motion.button
                          onClick={handleBuyNow}
                          onMouseEnter={() => setIsBuyNowHovered(true)}
                          onMouseLeave={() => setIsBuyNowHovered(false)}
                          animate={wiggleBuyNow ? {
                            x: [0, -10, 10, -10, 10, 0],
                          } : {}}
                          transition={{
                            duration: 0.6,
                            ease: "easeInOut"
                          }}
                          className={`flex-1 px-6 py-3 rounded-full font-medium transition-all flex items-center justify-center gap-2 ${
                            isDark
                              ? 'bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-400/50'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600'
                          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Buy Now'
                          )}
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Portal to body to escape main element's blur filter
  if (!isMounted) return null;
  return createPortal(modalContent, document.body);
}

