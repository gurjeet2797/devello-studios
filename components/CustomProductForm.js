"use client"

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Check, Upload, PenTool, Trash2, MapPin, ExternalLink } from 'lucide-react';
import { Pacifico } from "next/font/google";
import { useRouter } from 'next/router';
import { useAuth } from './auth/AuthProvider';
import { useModal } from './ModalProvider';
import { getSupabase } from '../lib/supabaseClient';
import { 
  compressFile, 
  compressDataUrl, 
  compressImageForStorage, 
  calculateImageSize 
} from '../lib/imageCompression';
import ImageOverlay from './ImageOverlay';

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
});

const CustomProductForm = ({ isDark, onClose, onAnnotationModeChange, title = "Custom Builds" }) => {
  const { user } = useAuth();
  const { openAuthModal } = useModal();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submittedOrderId, setSubmittedOrderId] = useState(null);
  const [formData, setFormData] = useState({
    projectType: '',
    projectDescription: '',
    productDescription: '',
    projectStage: '',
    material: [], // Changed to array for multiple selections
    size: '',
    customSize: '',
    height: '',
    width: '',
    deliveryMethod: '',
    shippingAddress: null,
    uploadedImage: null,
    annotatedImage: null,
    previewImage: null,
    originalSpacePhoto: null, // Store original space photo for comparison
    spaceRenderedImage: null,
    name: '',
    email: '',
    phone: '',
    additionalInfo: '',
    website: '' // Honeypot field - should remain empty
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [spacePhoto, setSpacePhoto] = useState(null);
  const [isRenderingSpace, setIsRenderingSpace] = useState(false);
  const [spaceRenderError, setSpaceRenderError] = useState(null);
  const [showDesignRefinement, setShowDesignRefinement] = useState(false);
  const hasAutoSubmittedShipping = useRef(false);
  const hasAutoSubmittedPickup = useRef(false);
  const [refinementDescription, setRefinementDescription] = useState('');

  // Populate email and name from authenticated user
  useEffect(() => {
    if (user && user.email) {
      setFormData(prev => ({
        ...prev,
        email: prev.email || user.email,
        name: prev.name || user.user_metadata?.full_name || 
              user.user_metadata?.name || 
              (user.user_metadata?.given_name && user.user_metadata?.family_name 
                ? `${user.user_metadata.given_name} ${user.user_metadata.family_name}` 
                : user.email?.split('@')[0] || '')
      }));
    }
  }, [user]);

  // Debug: Track spaceRenderedImage state changes
  useEffect(() => {
    if (formData.spaceRenderedImage) {
      console.log('🖼️ [RENDER_PRODUCT_IN_SPACE] spaceRenderedImage state updated:', {
        hasImage: !!formData.spaceRenderedImage,
        imageLength: formData.spaceRenderedImage.length,
        imagePrefix: formData.spaceRenderedImage.substring(0, 50),
        isValid: formData.spaceRenderedImage.startsWith('data:image/')
      });
    }
  }, [formData.spaceRenderedImage]);

  // Notify parent when annotation mode changes
  useEffect(() => {
    if (onAnnotationModeChange) {
      onAnnotationModeChange(showAnnotation);
    }
  }, [showAnnotation, onAnnotationModeChange]);

  // Determine if this is for manufacturing/millwork based on title
  // Check for construction/renovation first, then manufacturing/product
  const titleLower = title.toLowerCase();
  const isMillworkForm = (titleLower.includes('product') || titleLower.includes('manufacturing')) && 
                         !titleLower.includes('renovation') && 
                         !titleLower.includes('construction');

  // Auto-submit when shipping address is complete
  useEffect(() => {
    if (currentStep === (isMillworkForm ? 5 : 4) && 
        isMillworkForm && 
        formData.deliveryMethod === 'shipping' && 
        formData.shippingAddress?.street && 
        formData.shippingAddress?.city && 
        formData.shippingAddress?.state && 
        formData.shippingAddress?.zip && 
        formData.shippingAddress?.country &&
        !hasAutoSubmittedShipping.current &&
        !isSubmitting &&
        submitStatus !== 'success') {
      hasAutoSubmittedShipping.current = true;
      const timer = setTimeout(() => {
        handleSubmit();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.shippingAddress, currentStep, isSubmitting, submitStatus, isMillworkForm, formData.deliveryMethod]);

  // Auto-advance to final step when submission is successful
  useEffect(() => {
    if (submitStatus === 'success' && submittedOrderId) {
      const maxStep = isMillworkForm ? 6 : 5;
      if (currentStep < maxStep) {
        setCurrentStep(maxStep);
      }
    }
  }, [submitStatus, submittedOrderId, currentStep, isMillworkForm]);

  // Auto-advance when project type is selected on step 1 (for renovation/construction forms)
  useEffect(() => {
    if (currentStep === 1 && !isMillworkForm && formData.projectType) {
      const timer = setTimeout(() => {
        handleNext();
      }, 300); // Small delay for better UX
      return () => clearTimeout(timer);
    }
  }, [formData.projectType, currentStep, isMillworkForm]);

  const [annotations, setAnnotations] = useState([]);
  const [activeAnnotationIndex, setActiveAnnotationIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const imageContainerRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Area selection state for millwork forms
  const [isSelectingArea, setIsSelectingArea] = useState(false);
  const [selectionArea, setSelectionArea] = useState(null);
  const [isCompositing, setIsCompositing] = useState(false);
  const [compositedImage, setCompositedImage] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const canvasRef = useRef(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Global mouse/touch handlers for area selection
  useEffect(() => {
    if (!isSelectingArea || !isMillworkForm) return;

    const handleGlobalMouseMove = (e) => {
      if (isDrawing) {
        handleAreaSelectionMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDrawing) {
        handleAreaSelectionEnd();
      }
    };

    const handleGlobalTouchMove = (e) => {
      if (isDrawing) {
        handleAreaSelectionMove(e);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDrawing) {
        handleAreaSelectionEnd();
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isSelectingArea, isDrawing, isMillworkForm]);

  const projectTypes = isMillworkForm ? [
    'Windows',
    'Doors',
    'Custom Mirror',
    'Glass Products',
    'Other Millwork'
  ] : [
    'General Renovation & Repairs',
    'Kitchen & Bathroom Remodel',
    'Custom millwork & Installation',
    'Apartment & Home Renovation'
  ];

  // Placeholder texts for each product category
  const productPlaceholders = {
    'Windows': [
      'I need a black aluminum window with frosted glass',
      'Custom wood-framed window for kitchen',
      'Modern glass window with metal frame'
    ],
    'Doors': [
      'Solid wood door with glass panels',
      'Metal security door',
      'Custom glass door entrance'
    ],
    'Custom Mirror': [
      'Large frameless bathroom mirror',
      'Wood-framed decorative mirror',
      'Metal-framed wall mirror'
    ],
    'Glass Products': [
      'Custom glass tabletop',
      'Frosted glass partition',
      'Tempered glass shelving'
    ],
    'Other Millwork': [
      'Custom wood shelving unit',
      'Metal railing system',
      'Glass display case'
    ]
  };

  // Auto-cycle placeholders every 3 seconds when field is empty
  useEffect(() => {
    if (!isMillworkForm || !formData.projectType) return;
    if (formData.productDescription) return; // Don't cycle if user has typed
    
    const placeholders = productPlaceholders[formData.projectType];
    if (!placeholders || placeholders.length === 0) return;

    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [formData.projectType, formData.productDescription, isMillworkForm]);

  // Material auto-selection from description - returns array of detected materials
  const detectMaterialsFromDescription = (description) => {
    if (!description) return [];
    const descLower = description.toLowerCase();
    const detectedMaterials = [];
    
    // Check for metal keywords
    if (descLower.match(/\b(aluminum|aluminium|metal|steel|iron|brass|copper)\b/)) {
      detectedMaterials.push('Metal');
    }
    // Check for wood keywords
    if (descLower.match(/\b(wood|wooden|timber|oak|pine|maple|walnut|mahogany)\b/)) {
      detectedMaterials.push('Wood');
    }
    // Check for glass keywords
    if (descLower.match(/\b(glass|frosted|clear glass|tempered|mirror)\b/)) {
      detectedMaterials.push('Glass');
    }
    
    return detectedMaterials;
  };

  // Handle product description change
  const handleProductDescriptionChange = (value) => {
    setFormData(prev => {
      const updated = { ...prev, productDescription: value };
      // Auto-select materials if none already selected
      if (prev.material.length === 0 && value) {
        const detectedMaterials = detectMaterialsFromDescription(value);
        if (detectedMaterials.length > 0) {
          updated.material = detectedMaterials;
        }
      }
      return updated;
    });
  };

  // Toggle material selection
  const toggleMaterial = (material) => {
    setFormData(prev => {
      const currentMaterials = Array.isArray(prev.material) ? prev.material : (prev.material ? [prev.material] : []);
      const isSelected = currentMaterials.includes(material);
      
      if (isSelected) {
        // Remove material
        return { ...prev, material: currentMaterials.filter(m => m !== material) };
      } else {
        // Add material
        return { ...prev, material: [...currentMaterials, material] };
      }
    });
  };

  const projectStages = [
    'Starting stage',
    'Ready to start',
    'In progress'
  ];

  const handleNext = async () => {
    // Prevent duplicate calls while generating
    if (isGeneratingPreview) {
      return;
    }
    
    // If moving from step 2 to step 3 and it's a millwork form, generate preview
    if (currentStep === 2 && isMillworkForm && canProceed()) {
      // Move to step 3 immediately
      setCurrentStep(3);
      setIsGeneratingPreview(true);
      setPreviewError(null);
      setPreviewImage(null);
      
      try {
        // Get dimensions (use height and width)
        if (!formData.height || !formData.width) {
          throw new Error('Height and width are required');
        }
        const dimensions = `${formData.width} x ${formData.height}`;
        
        // Map project type to API format
        const productTypeMap = {
          'Windows': 'Window',
          'Doors': 'Door',
          'Custom Mirror': 'Mirror',
          'Glass Products': 'Glass Product',
          'Other Millwork': 'Millwork'
        };
        const productType = productTypeMap[formData.projectType] || formData.projectType;
        
        // Convert materials array to string for API (comma-separated or single material)
        const materials = Array.isArray(formData.material) ? formData.material : (formData.material ? [formData.material] : []);
        const materialString = materials.length > 0 ? materials.join(', ') : '';
        
        const response = await fetch('/api/ai/product-preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productType,
            material: materialString,
            dimensions,
            description: formData.productDescription || undefined
          })
        });
        
        // Check content type before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text.substring(0, 200));
          throw new Error('Server returned invalid response format');
        }
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || data.error || 'Failed to generate preview');
        }
        
        if (!data.image) {
          throw new Error('No image received from server');
        }
        
        setPreviewImage(data.image);
        // Store preview image in formData for submission
        setFormData(prev => ({ ...prev, previewImage: data.image }));
      } catch (error) {
        console.error('Preview generation error:', error);
        setPreviewError(error.message || 'Failed to generate preview. Please try again.');
      } finally {
        setIsGeneratingPreview(false);
      }
    } else {
      // For non-millwork forms or other steps, just advance
      const maxStep = isMillworkForm ? 6 : 5;
      if (currentStep < maxStep) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Handle space photo upload
  const handleSpacePhotoUpload = async (file) => {
    try {
      // Use more aggressive compression: 1280x1280, quality 0.7
      const compressed = await compressFile(file, 1280, 1280, 0.7);
      const sizeMB = calculateImageSize(compressed);
      console.log(`Space photo compressed to ${sizeMB.toFixed(2)}MB`);
      
      setSpacePhoto(compressed);
      // Store original space photo in formData for comparison feature
      // Clear old rendered image when uploading new space photo
      setFormData(prev => ({ 
        ...prev, 
        originalSpacePhoto: compressed,
        spaceRenderedImage: null // Clear old rendered image
      }));
      setSpaceRenderError(null);
      
      // Automatically render product in space
      await renderProductInSpace(compressed);
      
      // Reset file input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading space photo:', error);
      setSpaceRenderError('Failed to upload space photo. Please try again.');
      // Reset file input on error too
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Render product in space using Gemini
  const renderProductInSpace = async (spacePhotoData = null, refinementDesc = null) => {
    if (!formData.previewImage) {
      setSpaceRenderError('Product preview is required. Please go back and generate a preview first.');
      return;
    }

    setIsRenderingSpace(true);
    setSpaceRenderError(null);

    try {
      const spacePhotoToUse = spacePhotoData || spacePhoto;
      if (!spacePhotoToUse) {
        throw new Error('Space photo is required');
      }

      // Compress product preview image before sending (1280x1280, quality 0.7)
      const compressedPreview = await compressDataUrl(formData.previewImage, 1280, 1280, 0.7);
      const spaceSizeMB = calculateImageSize(spacePhotoToUse);
      const previewSizeMB = calculateImageSize(compressedPreview);
      const totalSizeMB = spaceSizeMB + previewSizeMB;
      
      console.log(`Sending to render API - Space: ${spaceSizeMB.toFixed(2)}MB, Preview: ${previewSizeMB.toFixed(2)}MB, Total: ${totalSizeMB.toFixed(2)}MB`);
      
      if (totalSizeMB > 8) {
        console.warn(`Combined image size (${totalSizeMB.toFixed(2)}MB) exceeds 8MB safety margin`);
      }

      const response = await fetch('/api/ai/render-product-in-space', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spacePhoto: spacePhotoToUse,
          productImage: compressedPreview,
          productDescription: formData.productDescription || undefined,
          refinementDescription: refinementDesc || undefined
        })
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned invalid response format');
      }

      const data = await response.json();

      // Debug: Log API response
      console.log('🔍 [RENDER_PRODUCT_IN_SPACE] API Response received:', {
        ok: response.ok,
        status: response.status,
        hasImage: !!data.image,
        imageType: data.image ? typeof data.image : 'none',
        imageLength: data.image ? data.image.length : 0,
        imagePrefix: data.image ? data.image.substring(0, 50) : 'none',
        error: data.error,
        message: data.message
      });

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to render product in space');
      }
      
      if (!data.image) {
        console.error('❌ [RENDER_PRODUCT_IN_SPACE] No image in response:', data);
        throw new Error('No image received from server');
      }

      // Validate image is a valid data URL
      if (!data.image.startsWith('data:image/')) {
        console.error('❌ [RENDER_PRODUCT_IN_SPACE] Invalid image format:', data.image.substring(0, 100));
        throw new Error('Invalid image format received from server');
      }

      console.log('✅ [RENDER_PRODUCT_IN_SPACE] Valid image received, compressing...');

      // Compress the rendered image before storing (1280x1280, quality 0.7)
      let compressedRendered;
      try {
        compressedRendered = await compressImageForStorage(data.image);
        const renderedSizeMB = calculateImageSize(compressedRendered);
        console.log(`✅ [RENDER_PRODUCT_IN_SPACE] Rendered image compressed to ${renderedSizeMB.toFixed(2)}MB for storage`);
        
        // Validate compressed image is still valid
        if (!compressedRendered || !compressedRendered.startsWith('data:image/')) {
          console.error('❌ [RENDER_PRODUCT_IN_SPACE] Compression produced invalid image');
          throw new Error('Image compression failed');
        }
      } catch (compressionError) {
        console.error('❌ [RENDER_PRODUCT_IN_SPACE] Compression error:', compressionError);
        // Fallback: use original image if compression fails
        compressedRendered = data.image;
        console.log('⚠️ [RENDER_PRODUCT_IN_SPACE] Using uncompressed image as fallback');
      }

      // Store the compressed rendered image
      console.log('💾 [RENDER_PRODUCT_IN_SPACE] Storing rendered image in formData...');
      setFormData(prev => {
        const updated = { ...prev, spaceRenderedImage: compressedRendered };
        console.log('✅ [RENDER_PRODUCT_IN_SPACE] formData updated, spaceRenderedImage set:', {
          hasImage: !!updated.spaceRenderedImage,
          imageLength: updated.spaceRenderedImage ? updated.spaceRenderedImage.length : 0
        });
        return updated;
      });
      setShowDesignRefinement(false);
      setRefinementDescription('');
    } catch (error) {
      console.error('❌ [RENDER_PRODUCT_IN_SPACE] Error rendering product in space:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setSpaceRenderError(error.message || 'Failed to render product in space. Please try again.');
      // Clear any partial state
      setFormData(prev => ({ ...prev, spaceRenderedImage: null }));
    } finally {
      setIsRenderingSpace(false);
      console.log('🏁 [RENDER_PRODUCT_IN_SPACE] Rendering process completed');
    }
  };

  // Handle design refinement
  const handleTryAnotherDesign = () => {
    setShowDesignRefinement(true);
  };

  // Apply refinement
  const applyRefinement = async () => {
    if (!refinementDescription.trim()) {
      return;
    }
    await renderProductInSpace(null, refinementDescription);
  };

  // Legacy compressImage function - now uses utility, kept for backward compatibility
  const compressImage = (file, maxWidth = 1280, maxHeight = 1280, quality = 0.7) => {
    return compressFile(file, maxWidth, maxHeight, quality);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      // Reset file input if no file selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    try {
      // Compress image before storing (1280x1280, quality 0.7)
      const compressedImage = await compressFile(file, 1280, 1280, 0.7);
      const sizeMB = calculateImageSize(compressedImage);
      console.log(`Image compressed to ${sizeMB.toFixed(2)}MB`);
      
      // For millwork forms on step 4 (View in my space), handle space photo upload
      if (isMillworkForm && currentStep === 4) {
        await handleSpacePhotoUpload(file);
      } else {
        setFormData(prev => ({ ...prev, uploadedImage: compressedImage }));
        
        // For non-millwork forms, use annotation mode
        setShowAnnotation(true);
        setAnnotations([]);
        setActiveAnnotationIndex(null);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Error processing image. Please try again.');
      // Reset file input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle area selection for millwork forms
  const handleAreaSelectionStart = (e) => {
    if (!formData.uploadedImage || !isMillworkForm || !previewImage) return;
    
    const clickX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clickY = e.clientY || (e.touches && e.touches[0]?.clientY);
    
    if (!imageRef.current || !imageContainerRef.current) return;
    
    const imgRect = imageRef.current.getBoundingClientRect();
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    
    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;
    
    const relativeX = clickX - containerRect.left - imgLeft;
    const relativeY = clickY - containerRect.top - imgTop;
    
    // Check if click is within image bounds
    if (relativeX < 0 || relativeX > imgRect.width || relativeY < 0 || relativeY > imgRect.height) {
      return;
    }
    
    setIsDrawing(true);
    setIsSelectingArea(true);
    setDrawStart({ x: relativeX, y: relativeY });
    setSelectionArea({ x: relativeX, y: relativeY, width: 0, height: 0 });
  };

  const handleAreaSelectionMove = (e) => {
    if (!isDrawing || !drawStart || !imageRef.current) return;
    
    const moveX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const moveY = e.clientY || (e.touches && e.touches[0]?.clientY);
    
    if (!moveX || !moveY) return;
    
    const imgRect = imageRef.current.getBoundingClientRect();
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    
    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;
    
    const relativeX = moveX - containerRect.left - imgLeft;
    const relativeY = moveY - containerRect.top - imgTop;
    
    const width = Math.abs(relativeX - drawStart.x);
    const height = Math.abs(relativeY - drawStart.y);
    const x = Math.min(relativeX, drawStart.x);
    const y = Math.min(relativeY, drawStart.y);
    
    setSelectionArea({
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: Math.min(width, imgRect.width - Math.max(0, x)),
      height: Math.min(height, imgRect.height - Math.max(0, y))
    });
  };

  const handleAreaSelectionEnd = () => {
    setIsDrawing(false);
  };

  const compositePreviewOntoArea = async () => {
    if (!formData.uploadedImage || !previewImage || !selectionArea) return;
    
    setIsCompositing(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Load uploaded image
      const uploadedImg = new Image();
      uploadedImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        uploadedImg.onload = resolve;
        uploadedImg.onerror = reject;
        uploadedImg.src = formData.uploadedImage;
      });
      
      // Set canvas to uploaded image size
      canvas.width = uploadedImg.width;
      canvas.height = uploadedImg.height;
      
      // Draw uploaded image
      ctx.drawImage(uploadedImg, 0, 0);
      
      // Load preview image
      const previewImg = new Image();
      previewImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        previewImg.onload = resolve;
        previewImg.onerror = reject;
        previewImg.src = previewImage;
      });
      
      // Calculate selection area in actual image coordinates
      const scaleX = uploadedImg.width / imageRef.current.width;
      const scaleY = uploadedImg.height / imageRef.current.height;
      
      const destX = selectionArea.x * scaleX;
      const destY = selectionArea.y * scaleY;
      const destWidth = selectionArea.width * scaleX;
      const destHeight = selectionArea.height * scaleY;
      
      // Draw preview image onto selected area
      ctx.drawImage(previewImg, destX, destY, destWidth, destHeight);
      
      // Convert to base64
      const compositedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCompositedImage(compositedDataUrl);
      setFormData(prev => ({ ...prev, annotatedImage: compositedDataUrl }));
      setIsSelectingArea(false);
      setSelectionArea(null);
    } catch (error) {
      console.error('Error compositing image:', error);
      alert('Error compositing image. Please try again.');
    } finally {
      setIsCompositing(false);
    }
  };

  const handleImageClick = (e) => {
    // For millwork forms with preview, use area selection
    if (isMillworkForm && previewImage && formData.uploadedImage && !compositedImage) {
      if (!isSelectingArea) {
        handleAreaSelectionStart(e);
      }
      return;
    }
    
    // Original annotation logic for non-millwork forms
    if (!imageContainerRef.current) return;
    
    // Don't create annotation if clicking on an annotation element
    if (e.target.closest('.annotation-badge') || e.target.closest('.annotation-input')) {
      return;
    }
    
    // Check if we've reached the maximum of 3 annotations
    if (annotations.length >= 3) {
      return;
    }
    
    // Find the actual image element within the container
    const img = imageContainerRef.current.querySelector('img');
    if (!img) return;
    
    // Get click coordinates - handle both mouse and touch events
    let clickX, clickY;
    if (e.touches && e.touches.length > 0) {
      // Touch event
      clickX = e.touches[0].clientX;
      clickY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      // TouchEnd event
      clickX = e.changedTouches[0].clientX;
      clickY = e.changedTouches[0].clientY;
    } else {
      // Mouse event
      clickX = e.clientX;
      clickY = e.clientY;
    }
    
    if (!clickX || !clickY) return;
    
    const imgRect = img.getBoundingClientRect();
    
    // Check if click is within image bounds
    if (
      clickX < imgRect.left ||
      clickX > imgRect.right ||
      clickY < imgRect.top ||
      clickY > imgRect.bottom
    ) {
      return; // Click is outside image bounds
    }
    
    // Calculate position relative to the image
    const x = ((clickX - imgRect.left) / imgRect.width) * 100;
    const y = ((clickY - imgRect.top) / imgRect.height) * 100;
    
    // Ensure coordinates are within 0-100% bounds
    if (x < 0 || x > 100 || y < 0 || y > 100) {
      return;
    }
    
    // Create new annotation
    const newAnnotation = {
      id: Date.now(),
      x: x,
      y: y,
      text: ''
    };
    
    setAnnotations(prev => [...prev, newAnnotation]);
    setActiveAnnotationIndex(annotations.length);
  };

  const updateAnnotationText = (index, text) => {
    setAnnotations(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], text };
      return updated;
    });
  };

  const removeAnnotation = (id) => {
    setAnnotations(prev => {
      const filtered = prev.filter(ann => ann.id !== id);
      // If we removed the active annotation, clear the active index
      const removedIndex = prev.findIndex(ann => ann.id === id);
      if (removedIndex === activeAnnotationIndex) {
        setActiveAnnotationIndex(null);
      } else if (removedIndex < activeAnnotationIndex) {
        // Adjust active index if we removed an annotation before it
        setActiveAnnotationIndex(prev => prev !== null ? prev - 1 : null);
      }
      return filtered;
    });
  };

  const finishAnnotation = () => {
    // Create annotated image with all markers and text
    if (formData.uploadedImage && annotations.length > 0) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Draw annotations (arrows and text)
        annotations.forEach(ann => {
          if (ann.text) {
            const x = (ann.x / 100) * canvas.width;
            const y = (ann.y / 100) * canvas.height;
            
            // Draw arrow pointer
            ctx.fillStyle = isDark ? '#ffffff' : '#000000';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 10, y - 20);
            ctx.lineTo(x + 10, y - 20);
            ctx.closePath();
            ctx.fill();
            
            // Draw text background
            ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)';
            const textWidth = ctx.measureText(ann.text).width;
            ctx.fillRect(x + 15, y - 25, textWidth + 10, 20);
            
            // Draw text
            ctx.fillStyle = isDark ? '#ffffff' : '#000000';
            ctx.font = '12px Arial';
            ctx.fillText(ann.text, x + 20, y - 12);
          }
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        setFormData(prev => ({ ...prev, annotatedImage: dataUrl }));
      };
      img.src = formData.uploadedImage;
    } else {
      // No annotations, just use original image
      setFormData(prev => ({ ...prev, annotatedImage: formData.uploadedImage }));
    }
    setShowAnnotation(false);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, uploadedImage: null, annotatedImage: null }));
    setShowAnnotation(false);
    setAnnotations([]);
    setActiveAnnotationIndex(null);
    // Reset area selection state for millwork forms
    setIsSelectingArea(false);
    setSelectionArea(null);
    setCompositedImage(null);
  };

  const handleSubmit = async () => {
    // Validate required fields for guest submissions
    if (!user) {
      // For guest users, validate name and email are provided
      if (!formData.name || !formData.name.trim()) {
        alert('Please provide your name to submit the request.');
        return;
      }
      if (!formData.email || !formData.email.trim()) {
        alert('Please provide your email address to submit the request.');
        return;
      }
      // Validate email format
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        alert('Please provide a valid email address.');
        return;
      }
    }
    console.log('Submit button clicked');
    
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Compress all images before submission (1280x1280, quality 0.7)
      const submissionData = { ...formData };
      
      // Ensure email and name are populated from authenticated user if missing
      if (user) {
        if (!submissionData.email && user.email) {
          submissionData.email = user.email;
        }
        if (!submissionData.name) {
          submissionData.name = user.user_metadata?.full_name || 
                               user.user_metadata?.name || 
                               (user.user_metadata?.given_name && user.user_metadata?.family_name 
                                 ? `${user.user_metadata.given_name} ${user.user_metadata.family_name}` 
                                 : user.email?.split('@')[0] || 'User');
        }
      }
      
      // Convert materials array to string for submission (comma-separated)
      if (Array.isArray(submissionData.material)) {
        submissionData.material = submissionData.material.join(', ');
      } else if (!submissionData.material) {
        submissionData.material = '';
      }
      
      // Compress uploaded image if present
      if (submissionData.uploadedImage) {
        const originalSize = calculateImageSize(submissionData.uploadedImage);
        submissionData.uploadedImage = await compressImageForStorage(submissionData.uploadedImage);
        const compressedSize = calculateImageSize(submissionData.uploadedImage);
        console.log(`Uploaded image: ${originalSize.toFixed(2)}MB → ${compressedSize.toFixed(2)}MB (${((1 - compressedSize/originalSize) * 100).toFixed(1)}% reduction)`);
      }
      
      // Compress annotated image if present
      if (submissionData.annotatedImage) {
        const originalSize = calculateImageSize(submissionData.annotatedImage);
        submissionData.annotatedImage = await compressImageForStorage(submissionData.annotatedImage);
        const compressedSize = calculateImageSize(submissionData.annotatedImage);
        console.log(`Annotated image: ${originalSize.toFixed(2)}MB → ${compressedSize.toFixed(2)}MB (${((1 - compressedSize/originalSize) * 100).toFixed(1)}% reduction)`);
      }
      
      // Compress preview image if present
      if (submissionData.previewImage) {
        const originalSize = calculateImageSize(submissionData.previewImage);
        submissionData.previewImage = await compressImageForStorage(submissionData.previewImage);
        const compressedSize = calculateImageSize(submissionData.previewImage);
        console.log(`Preview image: ${originalSize.toFixed(2)}MB → ${compressedSize.toFixed(2)}MB (${((1 - compressedSize/originalSize) * 100).toFixed(1)}% reduction)`);
      }
      
      // Compress space rendered image if present
      if (submissionData.spaceRenderedImage) {
        const originalSize = calculateImageSize(submissionData.spaceRenderedImage);
        submissionData.spaceRenderedImage = await compressImageForStorage(submissionData.spaceRenderedImage);
        const compressedSize = calculateImageSize(submissionData.spaceRenderedImage);
        console.log(`Space rendered image: ${originalSize.toFixed(2)}MB → ${compressedSize.toFixed(2)}MB (${((1 - compressedSize/originalSize) * 100).toFixed(1)}% reduction)`);
      }
      
      // Log total submission size
      const totalSize = calculateImageSize(submissionData.uploadedImage || '') +
                       calculateImageSize(submissionData.annotatedImage || '') +
                       calculateImageSize(submissionData.previewImage || '') +
                       calculateImageSize(submissionData.spaceRenderedImage || '');
      console.log(`Total submission size: ${totalSize.toFixed(2)}MB`);
      
      await submitForm(submissionData);
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
      setIsSubmitting(false);
      alert('Error preparing form data. Please try again.');
    }
  };

  const submitForm = async (data) => {
    try {
      console.log('Submitting form data...');
      // Get auth token if user is authenticated (optional for guest submissions)
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (user) {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch('/api/custom-builds/submit', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data),
      });

      let responseData;
      try {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (response.ok) {
        console.log('Form submitted successfully');
        setSubmitStatus('success');
        // Store the order ID if returned
        if (responseData.orderId || responseData.requestId || responseData.id) {
          setSubmittedOrderId(responseData.orderId || responseData.requestId || responseData.id);
        }
      } else {
        console.error('Submission error:', responseData);
        setSubmitStatus('error');
        alert(responseData.error || 'Failed to submit form. Please try again.');
      }
    } catch (error) {
      console.error('Network error:', error);
      setSubmitStatus('error');
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.projectType !== '';
      case 2:
        if (isMillworkForm) {
          // For millwork forms, require material, height, width, and delivery method
          const materials = Array.isArray(formData.material) ? formData.material : (formData.material ? [formData.material] : []);
          return materials.length > 0 && formData.height !== '' && formData.width !== '' && formData.deliveryMethod !== '';
        }
        return formData.projectDescription !== '' && formData.projectStage !== '';
      case 3:
        // Preview step - always allow proceeding (preview is optional)
        return true;
      case 4:
        // For millwork forms, allow proceeding (space rendering is optional)
        // For non-millwork forms, require uploaded or annotated image
        if (isMillworkForm) {
          return true; // Allow proceeding even without space rendering
        }
        // For non-millwork forms, if guest user, require contact info; otherwise require image
        if (!user) {
          return formData.name && formData.name.trim() && formData.email && formData.email.trim() && /\S+@\S+\.\S+/.test(formData.email);
        }
        return formData.uploadedImage !== null || formData.annotatedImage !== null;
      case 5:
        // For millwork forms, if shipping selected, require shipping address
        // For guest users, require contact info
        if (!user) {
          return formData.name && formData.name.trim() && formData.email && formData.email.trim() && /\S+@\S+\.\S+/.test(formData.email);
        }
        if (isMillworkForm) {
          if (formData.deliveryMethod === 'shipping') {
            return formData.shippingAddress?.street && 
                   formData.shippingAddress?.city && 
                   formData.shippingAddress?.state && 
                   formData.shippingAddress?.zip && 
                   formData.shippingAddress?.country;
          }
          return true; // Pick-up doesn't need address
        }
        return true; // Non-millwork forms don't have step 5 for authenticated users
      case 6:
        // Final step - always allow (will auto-submit)
        return true;
      default:
        return false;
    }
  };

  return (
    <div className={`w-full flex flex-col ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ maxHeight: 'calc(100vh - 100px)', overflow: 'hidden' }}>
      {/* Header */}
      <AnimatePresence>
        {!showAnnotation && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-2 sm:mb-4 text-center flex-shrink-0 pb-2 sm:pb-3 pt-4 sm:pt-2"
          >
            <h2 className={`text-2xl sm:text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className={pacifico.className}>{title}</span>
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Steps */}
      <AnimatePresence>
        {!showAnnotation && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between mb-6 sm:mb-6 px-4 sm:px-8 md:px-16 flex-shrink-0 max-w-[280px] sm:max-w-none mx-auto sm:mx-0 pt-2 sm:pt-0 pb-3 sm:pb-4"
          >
        {(isMillworkForm ? [1, 2, 3, 4, 5] : [1, 2, 3, 4]).map((step) => (
          <React.Fragment key={step}>
            <div className="flex items-center">
              <div
                className={`about-devello-glass w-6 h-6 rounded-full flex items-center justify-center font-medium text-sm transition-all ${
                  currentStep >= step
                    ? isDark
                      ? 'text-white border-2'
                      : 'text-gray-900 border-2'
                    : isDark
                    ? 'text-white/80 border-2'
                    : 'text-gray-700 border-2'
                }`}
                style={{
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                  backgroundColor: currentStep > step
                    ? (isDark ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.15)')
                    : currentStep >= step
                    ? (isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)')
                    : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                  borderColor: currentStep > step
                    ? (isDark ? 'rgba(251, 146, 60, 0.4)' : 'rgba(249, 115, 22, 0.3)')
                    : currentStep >= step
                    ? (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)')
                    : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)')
                }}
              >
                {currentStep > step ? (
                  <Check className="w-3 h-3" style={{ color: 'rgba(255, 255, 255, 1)' }} />
                ) : (
                  step
                )}
              </div>
            </div>
            {step < (isMillworkForm ? 5 : 4) && (
              <div
                className={`flex-1 h-0.5 mx-3 sm:mx-1 min-w-[8px] ${
                  currentStep > step
                    ? isDark ? 'bg-white/30' : 'bg-gray-900/30'
                    : isDark ? 'bg-white/10' : 'bg-gray-300'
                }`}
              />
            )}
          </React.Fragment>
        ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Steps - Fixed height container */}
      <div className={`${showAnnotation ? 'flex-1 min-h-0 overflow-y-auto' : 'overflow-y-auto'} overflow-x-hidden`} style={showAnnotation ? { maxHeight: '100%', height: '100%' } : { maxHeight: 'calc(100vh - 200px)', height: 'auto' }}>
        <AnimatePresence mode="wait">
          {/* Step 1: Project Type */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-hidden"
            >
              <div>
                <h3 className={`text-lg font-medium mb-2 sm:mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {isMillworkForm ? 'What would you like to create?' : 'What type of project?'}
                </h3>
                <p className={`text-sm mb-4 sm:mb-4 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                  Select the type of project you're planning. This helps us understand your needs and provide the right service.
                </p>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 mb-2 sm:mb-6">
                  {projectTypes.map((type, index) => (
                    <motion.button
                      key={type}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.2, duration: 0.3 }}
                      onClick={() => setFormData(prev => ({ ...prev, projectType: type }))}
                      whileTap={{ 
                        scale: 0.95,
                        transition: { 
                          type: "spring", 
                          stiffness: 400, 
                          damping: 25 
                        }
                      }}
                      className={`about-devello-glass px-4 py-3 rounded-2xl text-sm font-medium transition-all w-full sm:w-auto sm:flex-shrink-0 ${
                        formData.projectType === type
                          ? isDark
                            ? 'text-white border-2'
                            : 'text-white border-2'
                          : isDark
                          ? 'text-white/70 border hover:text-white'
                          : 'text-gray-700 border hover:text-gray-900'
                      }`}
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: formData.projectType === type 
                          ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.3)')
                          : 'rgba(255, 255, 255, 0.15)',
                        borderColor: formData.projectType === type
                          ? (isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)')
                          : 'rgba(255, 255, 255, 0.25)'
                      }}
                    >
                      {type}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Product-Specific Details */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full space-y-6 sm:space-y-6 overflow-y-auto overflow-x-hidden"
            >
              {isMillworkForm ? (
                <>
                  {/* Product Description Field - Above Material Options */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0, duration: 0.3 }}
                  >
                    <h3 className={`text-lg font-medium mb-4 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Describe your product?
                    </h3>
                    <input
                      type="text"
                      value={formData.productDescription}
                      onChange={(e) => handleProductDescriptionChange(e.target.value)}
                      placeholder={productPlaceholders[formData.projectType]?.[placeholderIndex] || 'Describe your product'}
                      className={`about-devello-glass w-full px-4 py-3 rounded-xl border text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderColor: formData.productDescription ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                        fontSize: '16px',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = formData.productDescription ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.25)';
                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                      }}
                    />
                  </motion.div>

                  {/* Doors */}
                  {formData.projectType === 'Doors' && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                      >
                        <h3 className={`text-lg font-medium mb-4 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Material
                        </h3>
                        <div className="grid grid-cols-3 gap-2.5">
                          {['Wood', 'Metal', 'Glass'].map((material, index) => {
                            const currentMaterials = Array.isArray(formData.material) ? formData.material : (formData.material ? [formData.material] : []);
                            const isSelected = currentMaterials.includes(material);
                            return (
                              <motion.button
                                key={material}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                onClick={() => toggleMaterial(material)}
                                whileTap={{ scale: 0.95 }}
                                className={`about-devello-glass px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'text-white border-2'
                                    : isDark ? 'text-white/70 border hover:text-white' : 'text-gray-700 border hover:text-gray-900'
                                }`}
                                style={{
                                  backdropFilter: 'blur(2px)',
                                  WebkitBackdropFilter: 'blur(2px)',
                                  backgroundColor: isSelected 
                                    ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.3)')
                                    : 'rgba(255, 255, 255, 0.15)',
                                  borderColor: isSelected
                                    ? (isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)')
                                    : 'rgba(255, 255, 255, 0.25)'
                                }}
                              >
                                {material}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        <h3 className={`text-lg font-medium mb-4 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Dimensions
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                              Height (inches)
                            </label>
                            <input
                              type="number"
                              value={formData.height}
                              onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                              placeholder="80"
                              className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                              style={{
                                backdropFilter: 'blur(2px)',
                                WebkitBackdropFilter: 'blur(2px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                borderColor: formData.height ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                                fontSize: '16px'
                              }}
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                              Width (inches)
                            </label>
                            <input
                              type="number"
                              value={formData.width}
                              onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                              placeholder="36"
                              className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                              style={{
                                backdropFilter: 'blur(2px)',
                                WebkitBackdropFilter: 'blur(2px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                borderColor: formData.width ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                                fontSize: '16px'
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                            Pick-up or Shipping
                          </label>
                          <div className="grid grid-cols-2 gap-2.5">
                            {['Pick-up', 'Shipping'].map((method, index) => (
                              <motion.button
                                key={method}
                                type="button"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 + (index * 0.1), duration: 0.3 }}
                                onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: method.toLowerCase().replace('-', '') }))}
                                whileTap={{ scale: 0.95 }}
                                className={`about-devello-glass px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                  formData.deliveryMethod === method.toLowerCase().replace('-', '')
                                    ? 'text-white border-2'
                                    : isDark ? 'text-white/70 border hover:text-white' : 'text-gray-700 border hover:text-gray-900'
                                }`}
                                style={{
                                  backdropFilter: 'blur(2px)',
                                  WebkitBackdropFilter: 'blur(2px)',
                                  backgroundColor: formData.deliveryMethod === method.toLowerCase().replace('-', '')
                                    ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.3)')
                                    : 'rgba(255, 255, 255, 0.15)',
                                  borderColor: formData.deliveryMethod === method.toLowerCase().replace('-', '')
                                    ? (isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)')
                                    : 'rgba(255, 255, 255, 0.25)'
                                }}
                              >
                                {method}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}

                  {/* Windows */}
                  {formData.projectType === 'Windows' && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                      >
                        <h3 className={`text-lg font-medium mb-4 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Material
                        </h3>
                        <div className="grid grid-cols-3 gap-2.5">
                          {['Wood', 'Metal', 'Glass'].map((material, index) => {
                            const currentMaterials = Array.isArray(formData.material) ? formData.material : (formData.material ? [formData.material] : []);
                            const isSelected = currentMaterials.includes(material);
                            return (
                              <motion.button
                                key={material}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 + (index * 0.1), duration: 0.3 }}
                                onClick={() => toggleMaterial(material)}
                                whileTap={{ scale: 0.95 }}
                                className={`about-devello-glass px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'text-white border-2'
                                    : isDark ? 'text-white/70 border hover:text-white' : 'text-gray-700 border hover:text-gray-900'
                                }`}
                                style={{
                                  backdropFilter: 'blur(2px)',
                                  WebkitBackdropFilter: 'blur(2px)',
                                  backgroundColor: isSelected 
                                    ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.3)')
                                    : 'rgba(255, 255, 255, 0.15)',
                                  borderColor: isSelected
                                    ? (isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)')
                                    : 'rgba(255, 255, 255, 0.25)'
                                }}
                              >
                                {material}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        <h3 className={`text-lg font-medium mb-4 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Dimensions
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                              Height (inches)
                            </label>
                            <input
                              type="number"
                              value={formData.height}
                              onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                              placeholder="48"
                              className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                              style={{
                                backdropFilter: 'blur(2px)',
                                WebkitBackdropFilter: 'blur(2px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                borderColor: formData.height ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                                fontSize: '16px'
                              }}
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                              Width (inches)
                            </label>
                            <input
                              type="number"
                              value={formData.width}
                              onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                              placeholder="36"
                              className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                              style={{
                                backdropFilter: 'blur(2px)',
                                WebkitBackdropFilter: 'blur(2px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                borderColor: formData.width ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                                fontSize: '16px'
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                            Pick-up or Shipping
                          </label>
                          <div className="grid grid-cols-2 gap-2.5">
                            {['Pick-up', 'Shipping'].map((method, index) => (
                              <motion.button
                                key={method}
                                type="button"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 + (index * 0.1), duration: 0.3 }}
                                onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: method.toLowerCase().replace('-', '') }))}
                                whileTap={{ scale: 0.95 }}
                                className={`about-devello-glass px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                  formData.deliveryMethod === method.toLowerCase().replace('-', '')
                                    ? 'text-white border-2'
                                    : isDark ? 'text-white/70 border hover:text-white' : 'text-gray-700 border hover:text-gray-900'
                                }`}
                                style={{
                                  backdropFilter: 'blur(2px)',
                                  WebkitBackdropFilter: 'blur(2px)',
                                  backgroundColor: formData.deliveryMethod === method.toLowerCase().replace('-', '')
                                    ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.3)')
                                    : 'rgba(255, 255, 255, 0.15)',
                                  borderColor: formData.deliveryMethod === method.toLowerCase().replace('-', '')
                                    ? (isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)')
                                    : 'rgba(255, 255, 255, 0.25)'
                                }}
                              >
                                {method}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}

                  {/* Custom Mirror */}
                  {formData.projectType === 'Custom Mirror' && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                      >
                        <h3 className={`text-lg font-medium mb-4 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Frame Material
                        </h3>
                        <div className="grid grid-cols-3 gap-2.5">
                          {['Wood', 'Metal', 'Frameless'].map((material, index) => {
                            const currentMaterials = Array.isArray(formData.material) ? formData.material : (formData.material ? [formData.material] : []);
                            const isSelected = currentMaterials.includes(material);
                            return (
                              <motion.button
                                key={material}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 + (index * 0.1), duration: 0.3 }}
                                onClick={() => toggleMaterial(material)}
                                whileTap={{ scale: 0.95 }}
                                className={`about-devello-glass px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'text-white border-2'
                                    : isDark ? 'text-white/70 border hover:text-white' : 'text-gray-700 border hover:text-gray-900'
                                }`}
                                style={{
                                  backdropFilter: 'blur(2px)',
                                  WebkitBackdropFilter: 'blur(2px)',
                                  backgroundColor: isSelected 
                                    ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.3)')
                                    : 'rgba(255, 255, 255, 0.15)',
                                  borderColor: isSelected
                                    ? (isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)')
                                    : 'rgba(255, 255, 255, 0.25)'
                                }}
                              >
                                {material}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        <h3 className={`text-lg font-medium mb-4 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Dimensions
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                              Height (inches)
                            </label>
                            <input
                              type="number"
                              value={formData.height}
                              onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                              placeholder="36"
                              className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                              style={{
                                backdropFilter: 'blur(2px)',
                                WebkitBackdropFilter: 'blur(2px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                borderColor: formData.height ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                                fontSize: '16px'
                              }}
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                              Width (inches)
                            </label>
                            <input
                              type="number"
                              value={formData.width}
                              onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                              placeholder="24"
                              className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                              style={{
                                backdropFilter: 'blur(2px)',
                                WebkitBackdropFilter: 'blur(2px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                borderColor: formData.width ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                                fontSize: '16px'
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                            Pick-up or Shipping
                          </label>
                          <div className="grid grid-cols-2 gap-2.5">
                            {['Pick-up', 'Shipping'].map((method, index) => (
                              <motion.button
                                key={method}
                                type="button"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 + (index * 0.1), duration: 0.3 }}
                                onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: method.toLowerCase().replace('-', '') }))}
                                whileTap={{ scale: 0.95 }}
                                className={`about-devello-glass px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                  formData.deliveryMethod === method.toLowerCase().replace('-', '')
                                    ? 'text-white border-2'
                                    : isDark ? 'text-white/70 border hover:text-white' : 'text-gray-700 border hover:text-gray-900'
                                }`}
                                style={{
                                  backdropFilter: 'blur(2px)',
                                  WebkitBackdropFilter: 'blur(2px)',
                                  backgroundColor: formData.deliveryMethod === method.toLowerCase().replace('-', '')
                                    ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.3)')
                                    : 'rgba(255, 255, 255, 0.15)',
                                  borderColor: formData.deliveryMethod === method.toLowerCase().replace('-', '')
                                    ? (isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)')
                                    : 'rgba(255, 255, 255, 0.25)'
                                }}
                              >
                                {method}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}

                  {/* Glass Products */}
                  {formData.projectType === 'Glass Products' && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                      >
                        <h3 className={`text-lg font-medium mb-4 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Glass Type
                        </h3>
                        <div className="grid grid-cols-2 gap-2.5">
                          {['Clear Glass', 'Frosted Glass', 'Tinted Glass', 'Tempered Glass'].map((material, index) => {
                            const currentMaterials = Array.isArray(formData.material) ? formData.material : (formData.material ? [formData.material] : []);
                            const isSelected = currentMaterials.includes(material);
                            return (
                              <motion.button
                                key={material}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 + (index * 0.1), duration: 0.3 }}
                                onClick={() => toggleMaterial(material)}
                                whileTap={{ scale: 0.95 }}
                                className={`about-devello-glass px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'text-white border-2'
                                    : isDark ? 'text-white/70 border hover:text-white' : 'text-gray-700 border hover:text-gray-900'
                                }`}
                                style={{
                                  backdropFilter: 'blur(2px)',
                                  WebkitBackdropFilter: 'blur(2px)',
                                  backgroundColor: isSelected 
                                    ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.3)')
                                    : 'rgba(255, 255, 255, 0.15)',
                                  borderColor: isSelected
                                    ? (isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)')
                                    : 'rgba(255, 255, 255, 0.25)'
                                }}
                              >
                                {material}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        <h3 className={`text-lg font-medium mb-4 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Dimensions
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                              Height (inches)
                            </label>
                            <input
                              type="number"
                              value={formData.height}
                              onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                              placeholder="72"
                              className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                              style={{
                                backdropFilter: 'blur(2px)',
                                WebkitBackdropFilter: 'blur(2px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                borderColor: formData.height ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                                fontSize: '16px'
                              }}
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                              Width (inches)
                            </label>
                            <input
                              type="number"
                              value={formData.width}
                              onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                              placeholder="48"
                              className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                              style={{
                                backdropFilter: 'blur(2px)',
                                WebkitBackdropFilter: 'blur(2px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                borderColor: formData.width ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                                fontSize: '16px'
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                            Pick-up or Shipping
                          </label>
                          <div className="grid grid-cols-2 gap-2.5">
                            {['Pick-up', 'Shipping'].map((method, index) => (
                              <motion.button
                                key={method}
                                type="button"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 + (index * 0.1), duration: 0.3 }}
                                onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: method.toLowerCase().replace('-', '') }))}
                                whileTap={{ scale: 0.95 }}
                                className={`about-devello-glass px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                  formData.deliveryMethod === method.toLowerCase().replace('-', '')
                                    ? 'text-white border-2'
                                    : isDark ? 'text-white/70 border hover:text-white' : 'text-gray-700 border hover:text-gray-900'
                                }`}
                                style={{
                                  backdropFilter: 'blur(2px)',
                                  WebkitBackdropFilter: 'blur(2px)',
                                  backgroundColor: formData.deliveryMethod === method.toLowerCase().replace('-', '')
                                    ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.3)')
                                    : 'rgba(255, 255, 255, 0.15)',
                                  borderColor: formData.deliveryMethod === method.toLowerCase().replace('-', '')
                                    ? (isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)')
                                    : 'rgba(255, 255, 255, 0.25)'
                                }}
                              >
                                {method}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}

                  {/* Other Millwork */}
                  {formData.projectType === 'Other Millwork' && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                      >
                        <h3 className={`text-lg font-medium mb-4 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Material
                        </h3>
                        <div className="grid grid-cols-3 gap-2.5">
                          {['Wood', 'Metal', 'Composite'].map((material, index) => {
                            const currentMaterials = Array.isArray(formData.material) ? formData.material : (formData.material ? [formData.material] : []);
                            const isSelected = currentMaterials.includes(material);
                            return (
                              <motion.button
                                key={material}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                onClick={() => toggleMaterial(material)}
                                whileTap={{ scale: 0.95 }}
                                className={`about-devello-glass px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'text-white border-2'
                                    : isDark ? 'text-white/70 border hover:text-white' : 'text-gray-700 border hover:text-gray-900'
                                }`}
                                style={{
                                  backdropFilter: 'blur(2px)',
                                  WebkitBackdropFilter: 'blur(2px)',
                                  backgroundColor: isSelected 
                                    ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.3)')
                                    : 'rgba(255, 255, 255, 0.15)',
                                  borderColor: isSelected
                                    ? (isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)')
                                    : 'rgba(255, 255, 255, 0.25)'
                                }}
                              >
                                {material}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        <h3 className={`text-lg font-medium mb-4 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Dimensions
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                              Height (inches)
                            </label>
                            <input
                              type="number"
                              value={formData.height}
                              onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                              placeholder="72"
                              className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                              style={{
                                backdropFilter: 'blur(2px)',
                                WebkitBackdropFilter: 'blur(2px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                borderColor: formData.height ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                                fontSize: '16px'
                              }}
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                              Width (inches)
                            </label>
                            <input
                              type="number"
                              value={formData.width}
                              onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                              placeholder="48"
                              className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                              style={{
                                backdropFilter: 'blur(2px)',
                                WebkitBackdropFilter: 'blur(2px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                borderColor: formData.width ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                                fontSize: '16px'
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                            Pick-up or Shipping
                          </label>
                          <div className="grid grid-cols-2 gap-2.5">
                            {['Pick-up', 'Shipping'].map((method, index) => (
                              <motion.button
                                key={method}
                                type="button"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 + (index * 0.1), duration: 0.3 }}
                                onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: method.toLowerCase().replace('-', '') }))}
                                whileTap={{ scale: 0.95 }}
                                className={`about-devello-glass px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                  formData.deliveryMethod === method.toLowerCase().replace('-', '')
                                    ? 'text-white border-2'
                                    : isDark ? 'text-white/70 border hover:text-white' : 'text-gray-700 border hover:text-gray-900'
                                }`}
                                style={{
                                  backdropFilter: 'blur(2px)',
                                  WebkitBackdropFilter: 'blur(2px)',
                                  backgroundColor: formData.deliveryMethod === method.toLowerCase().replace('-', '')
                                    ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.3)')
                                    : 'rgba(255, 255, 255, 0.15)',
                                  borderColor: formData.deliveryMethod === method.toLowerCase().replace('-', '')
                                    ? (isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)')
                                    : 'rgba(255, 255, 255, 0.25)'
                                }}
                              >
                                {method}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Original construction form */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0, duration: 0.3 }}
              >
                <h3 className={`text-lg font-medium mb-4 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Current Project Stage
                </h3>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2.5">
                  {projectStages.map((stage, index) => (
                    <motion.button
                      key={stage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 + (index * 0.2), duration: 0.3 }}
                      onClick={() => setFormData(prev => ({ ...prev, projectStage: stage }))}
                      whileTap={{ 
                        scale: 0.95,
                        transition: { 
                          type: "spring", 
                          stiffness: 400, 
                          damping: 25 
                        }
                      }}
                      className={`about-devello-glass px-4 py-3 rounded-xl text-sm font-medium transition-all w-full sm:w-auto sm:flex-shrink-0 ${
                        formData.projectStage === stage
                          ? isDark
                            ? 'text-white border-2'
                            : 'text-white border-2'
                          : isDark
                          ? 'text-white/70 border hover:text-white'
                          : 'text-gray-700 border hover:text-gray-900'
                      }`}
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: formData.projectStage === stage 
                          ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.3)')
                          : 'rgba(255, 255, 255, 0.15)',
                        borderColor: formData.projectStage === stage
                          ? (isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)')
                          : 'rgba(255, 255, 255, 0.25)'
                      }}
                    >
                      {stage}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <h3 className={`text-lg font-medium mb-4 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Tell us about your project
                </h3>
                <textarea
                  value={formData.projectDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectDescription: e.target.value }))}
                  rows={4}
                  className="about-devello-glass w-full px-4 py-3 rounded-xl border transition-all resize-none text-sm text-white placeholder-white/40"
                  style={{
                    backdropFilter: 'blur(2px)',
                    WebkitBackdropFilter: 'blur(2px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                        fontSize: '16px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                  placeholder="Describe your project in detail..."
                />
              </motion.div>
                </>
              )}
            </motion.div>
          )}

          {/* Step 3: Product Preview (Millwork forms only) */}
          {currentStep === 3 && isMillworkForm && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center overflow-hidden min-h-0"
            >
              {isGeneratingPreview ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center space-y-4"
                >
                  <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                    Generating your product preview...
                  </p>
                </motion.div>
              ) : previewError ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center space-y-4 max-w-md text-center px-4"
                >
                  <div className={`text-sm p-4 rounded-xl ${
                    isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'
                  }`}>
                    {previewError}
                  </div>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                    You can continue without the preview.
                  </p>
                </motion.div>
              ) : previewImage ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center space-y-4 w-full"
                >
                  <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Your Product Preview
                  </h3>
                  <div className="about-devello-glass rounded-xl overflow-hidden border-2 max-w-md w-full"
                    style={{
                      backdropFilter: 'blur(2px)',
                      WebkitBackdropFilter: 'blur(2px)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.25)'
                    }}
                  >
                    <img
                      src={previewImage}
                      alt="Product preview"
                      className="w-full h-auto"
                      style={{ display: 'block' }}
                    />
                  </div>
                  <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'} text-center px-4`}>
                    Design can be changed in later stage of the order process in the form
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center space-y-4"
                >
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                    Preview will be generated when you proceed
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 3: Photo Upload (Non-millwork forms) or Step 4: View in my space (Millwork forms) */}
          {currentStep === (isMillworkForm ? 4 : 3) && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center overflow-hidden min-h-0"
            >
              {isMillworkForm ? (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4"
                  >
                    <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      View in my space
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      Upload a photo of your space to see how the product will look
                    </p>
                    
                    {/* Upload button - show when no rendered image and not rendering */}
                    {!formData.spaceRenderedImage && !isRenderingSpace && (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (fileInputRef.current) {
                            fileInputRef.current.click();
                          } else {
                            console.error('File input ref is not available');
                          }
                        }}
                        className={`about-devello-glass px-6 py-4 rounded-xl text-sm font-medium flex items-center gap-3 mx-auto ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                        style={{
                          backdropFilter: 'blur(2px)',
                          WebkitBackdropFilter: 'blur(2px)',
                          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)',
                          borderColor: isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)'
                        }}
                      >
                        <Upload className="w-5 h-5" />
                        {spacePhoto ? 'Upload Different Space Photo' : 'Upload Space Photo'}
                      </motion.button>
                    )}

                    {/* Rendering state */}
                    {isRenderingSpace && (
                      <div className="text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                        <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          Rendering product in your space...
                        </p>
                      </div>
                    )}

                    {/* Error state with retry */}
                    {spaceRenderError && !isRenderingSpace && !formData.spaceRenderedImage && (
                      <div className="text-center space-y-4">
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'}`}>
                          <p className="text-sm mb-3">{spaceRenderError}</p>
                          {spacePhoto && (
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSpaceRenderError(null);
                                renderProductInSpace();
                              }}
                              className={`about-devello-glass px-4 py-2 rounded-lg text-sm font-medium mt-2 ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}
                              style={{
                                backdropFilter: 'blur(2px)',
                                WebkitBackdropFilter: 'blur(2px)',
                                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)',
                                borderColor: isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)'
                              }}
                            >
                              Retry Rendering
                            </motion.button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rendered preview with compare feature - only show rendered image, never raw space photo */}
                    {formData.spaceRenderedImage && !isRenderingSpace && (
                      <div className="w-full max-w-4xl space-y-6 px-4">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative rounded-xl border-2 border-white/20 bg-white/5 flex items-center justify-center"
                          style={{
                            padding: '1rem',
                            minHeight: isMobile ? '300px' : '400px',
                            maxHeight: isMobile ? 'calc(100vh - 250px)' : '75vh',
                            overflow: 'hidden'
                          }}
                        >
                          <ImageOverlay
                            originalSrc={formData.spaceRenderedImage}
                            processedSrc={formData.originalSpacePhoto || spacePhoto}
                            showProcessed={true}
                            isProcessing={false}
                            allowHoldCompare={true}
                            className="w-full h-full"
                            alt={{ 
                              original: "Product rendered in your space", 
                              processed: "Your space photo" 
                            }}
                          />
                        </motion.div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          {!showDesignRefinement ? (
                            <>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={async () => {
                                  // Submit form and advance to success screen
                                  if (!isSubmitting) {
                                    await handleSubmit();
                                  }
                                }}
                                disabled={isSubmitting}
                                className={`about-devello-glass px-6 py-3 rounded-xl text-sm font-medium ${
                                  isDark ? 'text-white' : 'text-gray-900'
                                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                style={{
                                  backdropFilter: 'blur(2px)',
                                  WebkitBackdropFilter: 'blur(2px)',
                                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.4)',
                                  borderColor: isDark ? 'rgba(34, 197, 94, 0.5)' : 'rgba(34, 197, 94, 0.6)'
                                }}
                              >
                                {isSubmitting ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline mr-2" />
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 inline mr-2" />
                                    Approve
                                  </>
                                )}
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleTryAnotherDesign}
                                className={`about-devello-glass px-6 py-3 rounded-xl text-sm font-medium ${
                                  isDark ? 'text-white' : 'text-gray-900'
                                }`}
                                style={{
                                  backdropFilter: 'blur(2px)',
                                  WebkitBackdropFilter: 'blur(2px)',
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.7)',
                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)'
                                }}
                              >
                                Try Another Design
                              </motion.button>
                            </>
                          ) : (
                            <div className="w-full space-y-4">
                              <input
                                type="text"
                                value={refinementDescription}
                                onChange={(e) => setRefinementDescription(e.target.value)}
                                placeholder="e.g., I want the frame of mirror to be smaller"
                                className={`about-devello-glass w-full px-4 py-3 rounded-xl border text-sm ${
                                  isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'
                                }`}
                                style={{
                                  backdropFilter: 'blur(2px)',
                                  WebkitBackdropFilter: 'blur(2px)',
                                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                  borderColor: 'rgba(255, 255, 255, 0.25)',
                                  fontSize: '16px'
                                }}
                              />
                              <div className="flex gap-3">
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={applyRefinement}
                                  disabled={!refinementDescription.trim() || isRenderingSpace}
                                  className={`about-devello-glass px-6 py-3 rounded-xl text-sm font-medium flex-1 ${
                                    isDark ? 'text-white' : 'text-gray-900'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  style={{
                                    backdropFilter: 'blur(2px)',
                                    WebkitBackdropFilter: 'blur(2px)',
                                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)',
                                    borderColor: isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)'
                                  }}
                                >
                                  Apply Changes
                                </motion.button>
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setShowDesignRefinement(false);
                                    setRefinementDescription('');
                                  }}
                                  className={`about-devello-glass px-6 py-3 rounded-xl text-sm font-medium ${
                                    isDark ? 'text-white' : 'text-gray-900'
                                  }`}
                                  style={{
                                    backdropFilter: 'blur(2px)',
                                    WebkitBackdropFilter: 'blur(2px)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    borderColor: 'rgba(255, 255, 255, 0.25)'
                                  }}
                                >
                                  Cancel
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              ) : (
                <>
                  {/* Non-millwork form upload */}
                  {!formData.uploadedImage && !formData.annotatedImage && (
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`about-devello-glass rounded-2xl px-5 py-5 cursor-pointer text-center max-w-[200px] w-full flex flex-col items-center justify-center ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.7)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                        marginTop: '1rem',
                        marginBottom: '1rem'
                      }}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-3 opacity-70" />
                      <p className="text-xs font-medium">Tap to upload your space</p>
                    </motion.div>
                  )}

                  {/* Annotation Mode for Non-Millwork Forms */}
                  {showAnnotation && formData.uploadedImage && !isMillworkForm && (
                <div className="w-full h-full flex flex-col min-h-0">
                  {/* Image container - takes remaining space */}
                  <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-visible order-1">
                    <div
                      ref={imageContainerRef}
                      onClick={handleImageClick}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        handleImageClick(e);
                      }}
                      className="relative w-full h-full cursor-pointer flex items-center justify-center"
                      style={{ touchAction: 'none', minHeight: 0, overflow: 'visible' }}
                    >
                      <img
                        ref={imageRef}
                        src={formData.uploadedImage}
                        alt="Uploaded space"
                        className="rounded-xl border-2 border-white/20"
                        style={{ 
                          maxHeight: 'calc(100vh - 200px)', 
                          maxWidth: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain', 
                          pointerEvents: 'none' 
                        }}
                        draggable={false}
                      />
                      {/* Render annotation markers */}
                      {annotations.map((ann, index) => {
                        // Calculate position relative to image
                        const getAnnotationPosition = () => {
                          if (!imageRef.current || !imageContainerRef.current) {
                            return { left: `${ann.x}%`, top: `${ann.y}%` };
                          }
                          
                          const imgRect = imageRef.current.getBoundingClientRect();
                          const containerRect = imageContainerRef.current.getBoundingClientRect();
                          
                          // Calculate the image's position within the container
                          const imgLeft = imgRect.left - containerRect.left;
                          const imgTop = imgRect.top - containerRect.top;
                          const imgWidth = imgRect.width;
                          const imgHeight = imgRect.height;
                          
                          // Convert annotation percentage to pixels relative to image
                          const x = (ann.x / 100) * imgWidth + imgLeft;
                          const y = (ann.y / 100) * imgHeight + imgTop;
                          
                          // Convert to percentage of container
                          const containerWidth = containerRect.width;
                          const containerHeight = containerRect.height;
                          
                          return {
                            left: `${(x / containerWidth) * 100}%`,
                            top: `${(y / containerHeight) * 100}%`
                          };
                        };
                        
                        const position = getAnnotationPosition();
                        
                        return (
                        <motion.div
                          key={ann.id}
                          className="absolute group"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          style={{
                            ...position,
                            transform: 'translate(-50%, -100%)'
                          }}
                        >
                          {/* Modern Pin Marker */}
                          <motion.div
                            className="relative flex items-center justify-center cursor-pointer annotation-badge"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              removeAnnotation(ann.id);
                            }}
                            onTouchEnd={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              removeAnnotation(ann.id);
                            }}
                          >
                            <div
                              className="about-devello-glass rounded-full p-1.5 shadow-lg"
                              style={{
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                backgroundColor: isDark 
                                  ? 'rgba(255, 255, 255, 0.25)' 
                                  : 'rgba(0, 0, 0, 0.15)',
                                borderColor: isDark 
                                  ? 'rgba(255, 255, 255, 0.4)' 
                                  : 'rgba(0, 0, 0, 0.3)',
                                borderWidth: '2px'
                              }}
                            >
                              <MapPin 
                                className={`w-4 h-4 ${
                                  activeAnnotationIndex === index 
                                    ? 'text-blue-400' 
                                    : isDark ? 'text-white' : 'text-gray-900'
                                }`}
                                style={{
                                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                                }}
                              />
                            </div>
                            {/* Pin stem */}
                            <div
                              className="absolute top-full left-1/2 transform -translate-x-1/2"
                              style={{
                                width: '2px',
                                height: '12px',
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                              }}
                            />
                          </motion.div>

                          {/* Text Input - Modern Glass Design */}
                          {activeAnnotationIndex === index && (() => {
                            // Mobile-optimized positioning
                            const threshold = isMobile ? 45 : 50; // More aggressive threshold on mobile
                            const inputWidth = isMobile ? '180px' : '200px';
                            const maxWidth = isMobile ? 'calc(100vw - 6rem)' : 'calc(100vw - 4rem)';
                            const isOnRight = ann.x > threshold;
                            
                            return (
                            <motion.div
                              initial={{ opacity: 0, y: -8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.95 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                              className="absolute top-8 z-20 annotation-input"
                              style={{ 
                                width: inputWidth,
                                maxWidth: maxWidth,
                                left: isOnRight ? 'auto' : '0',
                                right: isOnRight ? '0' : 'auto',
                                transform: 'none',
                                position: 'absolute',
                                whiteSpace: 'nowrap',
                                boxSizing: 'border-box'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                            >
                              <div
                                className="about-devello-glass rounded-xl p-1 shadow-xl w-full"
                                style={{
                                  backdropFilter: 'blur(12px)',
                                  WebkitBackdropFilter: 'blur(12px)',
                                  backgroundColor: isDark 
                                    ? 'rgba(0, 0, 0, 0.6)' 
                                    : 'rgba(0, 0, 0, 0.7)',
                                  borderColor: isDark 
                                    ? 'rgba(255, 255, 255, 0.3)' 
                                    : 'rgba(255, 255, 255, 0.2)',
                                  borderWidth: '1px',
                                  boxSizing: 'border-box',
                                  maxWidth: '100%'
                                }}
                              >
                                <div className="relative flex items-center gap-2 w-full">
                                  <input
                                    type="text"
                                    value={ann.text}
                                    onChange={(e) => updateAnnotationText(index, e.target.value)}
                                    placeholder="Add description..."
                                    autoFocus
                                    className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium outline-none transition-all bg-white/10 text-white placeholder-white/50 focus:bg-white/15 focus:text-white min-w-0"
                                    style={{ fontSize: '16px' }}
                                    onBlur={() => {
                                      if (ann.text.trim() || annotations.length > 1) {
                                        setActiveAnnotationIndex(null);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === 'Escape') {
                                        e.preventDefault();
                                        setActiveAnnotationIndex(null);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </motion.div>
                            );
                          })()}

                          {/* Click to Edit Badge */}
                          {activeAnnotationIndex !== index && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute top-8 z-10"
                              style={{
                                left: '50%',
                                transform: 'translateX(-50%)',
                                position: 'absolute',
                                pointerEvents: 'none'
                              }}
                            >
                              <div
                                className="about-devello-glass px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg transition-all"
                                style={{
                                  backdropFilter: 'blur(8px)',
                                  WebkitBackdropFilter: 'blur(8px)',
                                  backgroundColor: ann.text
                                    ? 'rgba(0, 0, 0, 0.6)'
                                    : 'rgba(0, 0, 0, 0.5)',
                                  borderColor: ann.text
                                    ? 'rgba(96, 165, 250, 0.4)' 
                                    : 'rgba(255, 255, 255, 0.3)',
                                  borderWidth: '1px',
                                  color: 'rgba(255, 255, 255, 0.95)'
                                }}
                              >
                                {ann.text || 'Tap to add note'}
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                      })}
                    </div>
                  </div>
                  {/* Instruction text - below image */}
                  <div className="text-center mb-2 sm:mb-4 flex-shrink-0 order-2 pt-4 sm:pt-4">
                    <p className={`text-xs sm:text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      {annotations.length >= 3 
                        ? (
                          <>
                            Maximum 3 annotations reached.<br />
                            Click existing annotations to delete.
                          </>
                        ) : (
                          <>
                            Click on the image to add annotation points ({annotations.length}/3).<br />
                            Click existing annotations to delete.
                          </>
                        )
                      }
                    </p>
                  </div>
                  {/* Buttons at bottom */}
                  <div className="flex gap-2 justify-center mt-2 sm:mt-4 flex-shrink-0 pb-2 order-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setAnnotations([]);
                        setActiveAnnotationIndex(null);
                      }}
                      className="about-devello-glass px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-white"
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        borderColor: 'rgba(239, 68, 68, 0.4)'
                      }}
                    >
                      <Trash2 className="w-4 h-4" style={{ color: 'rgba(255, 255, 255, 1)' }} />
                      Clear All
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={finishAnnotation}
                      className="about-devello-glass px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-white"
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        borderColor: 'rgba(255, 255, 255, 0.35)'
                      }}
                    >
                      Done
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Show uploaded image for non-millwork forms only */}
              {!isMillworkForm && (formData.uploadedImage && !showAnnotation && !isSelectingArea) && (
                <div className="w-full space-y-4 flex flex-col items-center overflow-hidden">
                  <div className={`about-devello-glass rounded-2xl p-2 sm:p-4 relative inline-flex items-center justify-center ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                  style={{
                    backdropFilter: 'blur(2px)',
                    WebkitBackdropFilter: 'blur(2px)',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.7)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                    maxHeight: isMobile ? 'calc(100vh - 400px)' : '400px',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  >
                    <div className="relative inline-block max-w-full max-h-full flex items-center justify-center">
                      <img
                        src={formData.uploadedImage}
                        alt="Uploaded space"
                        className="rounded-lg object-contain block"
                        style={{ 
                          maxHeight: isMobile ? 'calc(100vh - 450px)' : '380px',
                          maxWidth: '100%',
                          width: 'auto',
                          height: 'auto',
                          display: 'block',
                          objectFit: 'contain'
                        }}
                      />
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => removeImage()}
                        className="about-devello-glass absolute top-2 right-2 p-2 rounded-full text-white z-10"
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          backdropFilter: 'blur(2px)',
                          WebkitBackdropFilter: 'blur(2px)',
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          borderColor: 'rgba(239, 68, 68, 0.4)'
                        }}
                      >
                        <Trash2 className="w-4 h-4" style={{ color: 'rgba(255, 255, 255, 1)' }} />
                      </motion.button>
                    </div>
                  </div>
                  {!showAnnotation && !isSelectingArea && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowAnnotation(true);
                        setFormData(prev => ({ ...prev, annotatedImage: null }));
                      }}
                      className="about-devello-glass px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 text-white"
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderColor: 'rgba(255, 255, 255, 0.25)'
                      }}
                    >
                      <PenTool className="w-4 h-4" />
                      Annotate Image
                    </motion.button>
                  )}
                </div>
              )}
                </>
              )}

              {/* File input - shared for both millwork and non-millwork forms */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </motion.div>
          )}

          {/* Step 5: Contact Information (Guest users only, before final step) */}
          {currentStep === (isMillworkForm ? 5 : 4) && !user && (
            <motion.div
              key="contact-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto px-4 sm:px-6 py-6"
            >
              <div>
                <h3 className={`text-lg font-medium mb-4 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Your contact information
                </h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  Please provide your contact details so we can reach you about your request.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border transition-all text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.8)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                        fontSize: '16px'
                      }}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border transition-all text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.8)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                        fontSize: '16px'
                      }}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border transition-all text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.8)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                        fontSize: '16px'
                      }}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  {/* Honeypot field - hidden from users but visible to bots */}
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    tabIndex="-1"
                    autoComplete="off"
                    style={{
                      position: 'absolute',
                      left: '-9999px',
                      opacity: 0,
                      pointerEvents: 'none'
                    }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Shipping Address (Millwork forms only, if shipping selected, authenticated users) */}
          {currentStep === (isMillworkForm ? 5 : 4) && isMillworkForm && formData.deliveryMethod === 'shipping' && user && (
            <motion.div
              key="step5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-hidden space-y-4"
            >
              <div>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Shipping Address
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress?.street || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shippingAddress: { ...(prev.shippingAddress || {}), street: e.target.value }
                      }))}
                      className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border transition-all text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                        fontSize: '16px'
                      }}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress?.city || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shippingAddress: { ...(prev.shippingAddress || {}), city: e.target.value }
                      }))}
                      className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border transition-all text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                        fontSize: '16px'
                      }}
                      placeholder="City"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                        State *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress?.state || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          shippingAddress: { ...(prev.shippingAddress || {}), state: e.target.value }
                        }))}
                        className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border transition-all text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                        style={{
                          backdropFilter: 'blur(2px)',
                          WebkitBackdropFilter: 'blur(2px)',
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          borderColor: 'rgba(255, 255, 255, 0.25)',
                          fontSize: '16px'
                        }}
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress?.zip || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          shippingAddress: { ...(prev.shippingAddress || {}), zip: e.target.value }
                        }))}
                        className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border transition-all text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                        style={{
                          backdropFilter: 'blur(2px)',
                          WebkitBackdropFilter: 'blur(2px)',
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          borderColor: 'rgba(255, 255, 255, 0.25)',
                          fontSize: '16px'
                        }}
                        placeholder="12345"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                      Country *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress?.country || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shippingAddress: { ...(prev.shippingAddress || {}), country: e.target.value }
                      }))}
                      className={`about-devello-glass w-full px-4 py-2.5 rounded-xl border transition-all text-sm ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`}
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                        fontSize: '16px'
                      }}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 6: Confirmation (Millwork forms) or Step 5 (Non-millwork forms) */}
          {currentStep === (isMillworkForm ? 6 : 5) && (
            <motion.div
              key="step5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center space-y-6"
            >
              <div className="text-center space-y-4 max-w-md px-4">
                <h3 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Request submitted successfully!
                </h3>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  Please check your email for confirmation
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Buttons */}
      <AnimatePresence>
        {!showAnnotation && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center mt-6 sm:mt-6 pt-2 pb-4 flex-shrink-0 ${
              submitStatus === 'success' && submittedOrderId 
                ? 'justify-center' 
                : 'justify-between'
            }`}
          >
        {!(submitStatus === 'success' && submittedOrderId) && (
          <motion.button
            onClick={(e) => {
              if (currentStep === 1) {
                onClose();
              } else {
                handleBack(e);
              }
            }}
            whileTap={{ 
              scale: 0.95,
              x: -8,
              transition: { 
                type: "spring", 
                stiffness: 600, 
                damping: 15 
              }
            }}
            className="about-devello-glass px-6 py-3 rounded-xl font-medium transition-all text-white/70 hover:text-white"
            style={{
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              backgroundColor: currentStep === 1 
                ? 'rgba(239, 68, 68, 0.2)' 
                : 'rgba(255, 255, 255, 0.15)',
              borderColor: currentStep === 1
                ? 'rgba(239, 68, 68, 0.4)'
                : 'rgba(255, 255, 255, 0.25)'
            }}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </motion.button>
        )}
        {currentStep < (isMillworkForm ? 6 : 5) ? (
            <motion.button
              onClick={() => {
                // On the last step before confirmation, submit instead of next
                const isLastStepBeforeConfirmation = currentStep === (isMillworkForm ? 5 : 4);
                if (isLastStepBeforeConfirmation) {
                  if (canProceed() && !isSubmitting) {
                    handleSubmit();
                  }
                } else {
                  handleNext();
                }
              }}
              disabled={!canProceed() || isGeneratingPreview || (currentStep === (isMillworkForm ? 5 : 4) && isSubmitting)}
              whileTap={{ 
                scale: (canProceed() && !isGeneratingPreview && !(currentStep === (isMillworkForm ? 5 : 4) && isSubmitting)) ? 0.95 : 1,
                x: (canProceed() && !isGeneratingPreview && !(currentStep === (isMillworkForm ? 5 : 4) && isSubmitting)) ? 8 : 0,
                transition: { 
                  type: "spring", 
                  stiffness: 600, 
                  damping: 15 
                }
              }}
              className={`about-devello-glass px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                (canProceed() && !isGeneratingPreview && !(currentStep === (isMillworkForm ? 5 : 4) && isSubmitting))
                  ? 'text-white'
                  : 'text-white/30 cursor-not-allowed'
              }`}
              style={{
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                backgroundColor: (canProceed() && !isGeneratingPreview && !(currentStep === (isMillworkForm ? 5 : 4) && isSubmitting))
                  ? 'rgba(255, 255, 255, 0.25)' 
                  : 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.25)'
              }}
            >
              {isGeneratingPreview ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : currentStep === (isMillworkForm ? 5 : 4) ? (
                <>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                  {submitStatus === 'success' && <Check className="w-4 h-4" />}
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          ) : submitStatus === 'success' && submittedOrderId ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-1 w-full"
          >
            {!user ? (
              <motion.button
                onClick={() => {
                  openAuthModal('signup', { redirectPath: null });
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`about-devello-glass px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 text-white`}
                style={{
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                  backgroundColor: 'rgba(34, 197, 94, 0.4)',
                  borderColor: 'rgba(34, 197, 94, 0.6)'
                }}
              >
                Sign up to track your project updates
                <ExternalLink className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                onClick={() => {
                  router.push('/client-portal');
                  onClose();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`about-devello-glass px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 text-white`}
                style={{
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                  backgroundColor: 'rgba(34, 197, 94, 0.4)',
                  borderColor: 'rgba(34, 197, 94, 0.6)'
                }}
              >
                View Order in Client Portal
                <ExternalLink className="w-4 h-4" />
              </motion.button>
            )}
          </motion.div>
        ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomProductForm;

