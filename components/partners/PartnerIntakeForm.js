import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChevronLeft, ChevronRight, Info, Loader2, X } from 'lucide-react';
import { useTheme } from '../Layout';
import Stepper, { Step } from '../Stepper';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { getSupabase } from '../../lib/supabaseClient';

const INDUSTRIES = [
  { id: 'consulting', label: 'Business Consulting', helper: 'Advise businesses.' },
  { id: 'software_dev', label: 'Software Development', helper: 'Design and ship software.' },
  { id: 'manufacturing', label: 'Manufacturing / Fabrication', helper: 'Make and assemble parts.' }
];

// Helper function to get industry color scheme matching navigation bar
const getIndustryColors = (industryId, isDark, isSelected) => {
  // Only show tint colors when selected, otherwise use neutral colors
  if (!isSelected) {
    return {
      bgColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
      textColor: isDark ? 'text-white/70 hover:text-white' : 'text-gray-700 hover:text-gray-900'
    };
  }
  
  // Selected state - show tint colors
  const baseOpacity = 0.3;
  const borderOpacity = 0.4;
  
  switch (industryId) {
    case 'software_dev':
      return {
        bgColor: isDark
          ? `color-mix(in srgb, rgba(56, 189, 248, ${baseOpacity}) 40%, rgba(220, 220, 220, 0.2))`
          : `color-mix(in srgb, rgba(56, 189, 248, ${baseOpacity - 0.05}) 40%, rgba(220, 220, 220, 0.2))`,
        borderColor: isDark 
          ? `rgba(125, 211, 252, ${borderOpacity})` 
          : `rgba(56, 189, 248, ${borderOpacity - 0.1})`,
        textColor: isDark ? 'text-sky-200' : 'text-sky-800'
      };
    case 'consulting':
      return {
        bgColor: isDark
          ? `color-mix(in srgb, rgba(251, 191, 36, ${baseOpacity}) 40%, rgba(220, 220, 220, 0.2))`
          : `color-mix(in srgb, rgba(251, 191, 36, ${baseOpacity - 0.05}) 40%, rgba(220, 220, 220, 0.2))`,
        borderColor: isDark 
          ? `rgba(253, 224, 71, ${borderOpacity})` 
          : `rgba(251, 191, 36, ${borderOpacity - 0.1})`,
        textColor: isDark ? 'text-amber-200' : 'text-amber-800'
      };
    case 'manufacturing':
      return {
        bgColor: isDark
          ? `color-mix(in srgb, rgba(52, 211, 153, ${baseOpacity}) 40%, rgba(220, 220, 220, 0.2))`
          : `color-mix(in srgb, rgba(52, 211, 153, ${baseOpacity - 0.05}) 40%, rgba(220, 220, 220, 0.2))`,
        borderColor: isDark 
          ? `rgba(110, 231, 183, ${borderOpacity})` 
          : `rgba(52, 211, 153, ${borderOpacity - 0.1})`,
        textColor: isDark ? 'text-emerald-200' : 'text-emerald-800'
      };
    default:
      return {
        bgColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
        textColor: isDark ? 'text-white/70 hover:text-white' : 'text-gray-700 hover:text-gray-900'
      };
  }
};

const SUBSERVICES = {
  consulting: ['Build a business', 'Expand existing business', 'Finance Consultation', 'Compliance'],
  software_dev: ['Web Apps', 'Mobile Apps', 'AI/ML', 'Data', 'DevOps'],
  manufacturing: ['CNC', '3D Printing', 'Molding', 'Sheet Metal', 'Assembly', 'Fabrication']
};

// Materials available for each manufacturing subservice
const SUBERVICE_MATERIALS = {
  'Fabrication': ['Metal', 'Glass', 'Iron', 'Wood', 'Composite', 'Plastic', 'Aluminum', 'Steel', 'Copper', 'Brass'],
  'CNC': ['Metal', 'Wood', 'Plastic', 'Aluminum', 'Steel', 'Composite'],
  '3D Printing': ['Plastic', 'Metal', 'Composite', 'Resin'],
  'Molding': ['Plastic', 'Metal', 'Composite', 'Rubber'],
  'Sheet Metal': ['Steel', 'Aluminum', 'Copper', 'Brass', 'Metal'],
  'Assembly': ['Metal', 'Plastic', 'Wood', 'Composite']
};

// Products based on material combinations
const MATERIAL_PRODUCTS = {
  'Metal+Glass': ['Metal Windows', 'Glass Doors', 'Metal Framing Systems', 'Curtain Walls', 'Storefront Systems'],
  'Metal+Wood': ['Metal-Wood Windows', 'Hybrid Doors', 'Composite Framing'],
  'Glass+Wood': ['Wood Windows', 'Glass Doors', 'Wood Framing'],
  'Metal': ['Metal Windows', 'Metal Doors', 'Metal Railings', 'Metal Structures', 'Metal Fabrication'],
  'Glass': ['Glass Windows', 'Glass Doors', 'Glass Partitions', 'Glass Railings'],
  'Wood': ['Wood Windows', 'Wood Doors', 'Wood Framing', 'Custom Woodwork'],
  'Iron': ['Iron Railings', 'Iron Gates', 'Iron Structures', 'Decorative Ironwork'],
  'Steel': ['Steel Windows', 'Steel Doors', 'Steel Structures', 'Steel Framing'],
  'Aluminum': ['Aluminum Windows', 'Aluminum Doors', 'Aluminum Framing', 'Aluminum Structures'],
  'Composite': ['Composite Windows', 'Composite Doors', 'Composite Structures'],
  'Plastic': ['Plastic Windows', 'Plastic Components', 'Plastic Fabrication'],
  'Copper': ['Copper Roofing', 'Copper Gutters', 'Copper Accents'],
  'Brass': ['Brass Hardware', 'Brass Accents', 'Brass Components']
};

// Helper function to get available products based on selected materials
const getAvailableProducts = (materials) => {
  if (!materials || materials.length === 0) return [];
  
  const products = new Set();
  
  // Add products for individual materials
  materials.forEach(material => {
    if (MATERIAL_PRODUCTS[material]) {
      MATERIAL_PRODUCTS[material].forEach(product => products.add(product));
    }
  });
  
  // Add products for material combinations
  if (materials.length >= 2) {
    // Check all pairs
    for (let i = 0; i < materials.length; i++) {
      for (let j = i + 1; j < materials.length; j++) {
        const combo = `${materials[i]}+${materials[j]}`;
        const reverseCombo = `${materials[j]}+${materials[i]}`;
        if (MATERIAL_PRODUCTS[combo]) {
          MATERIAL_PRODUCTS[combo].forEach(product => products.add(product));
        }
        if (MATERIAL_PRODUCTS[reverseCombo]) {
          MATERIAL_PRODUCTS[reverseCombo].forEach(product => products.add(product));
        }
      }
    }
  }
  
  return Array.from(products).sort();
};

const ENTITY_TYPES = ['LLC', 'C-Corp', 'S-Corp', 'Partnership', 'Sole Proprietor'];
const EMPLOYEE_BRACKETS = ['1-5', '6-10', '11-25', '26-50', '51-100', '100+'];
const YEARS_IN_BUSINESS = ['<1', '1-2', '3-5', '6-10', '10+'];

// Step 1: Industry Selection
function IndustryStep({ isDark, formData, setFormData, errors, setErrors, onAutoAdvance }) {
  const handleIndustrySelect = (industryId) => {
    // Clear any existing errors first
    if (errors.serviceType) {
      setErrors(prev => ({ ...prev, serviceType: '' }));
    }
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      serviceType: industryId,
      subservices: []
    }));
    
    // Auto-advance after a short delay to ensure state is updated
    if (onAutoAdvance) {
      setTimeout(() => {
        // Pass the industryId for validation
        onAutoAdvance(industryId);
      }, 400);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 py-2 sm:py-4 px-2 sm:px-0">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          What industry are you in?
        </h2>
        <p className={`text-xs sm:text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          Select the primary industry your business operates in
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto">
        {INDUSTRIES.map((industry) => {
          const isSelected = formData.serviceType === industry.id;
          const colors = getIndustryColors(industry.id, isDark, isSelected);
          
          return (
            <motion.button
              key={industry.id}
              onClick={() => handleIndustrySelect(industry.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={`about-devello-glass p-4 sm:p-6 rounded-2xl text-left transition-all border ${isSelected ? 'border-2' : 'border'} ${colors.textColor}`}
              style={{
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                backgroundColor: colors.bgColor,
                borderColor: colors.borderColor
              }}
            >
              <h3 className={`font-semibold mb-1 text-sm sm:text-base`}>
                {industry.label}
              </h3>
              <p className={`text-xs sm:text-sm ${isDark ? 'opacity-60' : 'opacity-70'}`}>
                {industry.helper}
              </p>
            </motion.button>
          );
        })}
      </div>

      {errors.serviceType && (
        <p className="text-xs sm:text-sm text-red-500 text-center mt-2">{errors.serviceType}</p>
      )}
    </div>
  );
}

// Step 2: Company Information
function CompanyStep({ isDark, formData, setFormData, errors, setErrors, onAutoAdvance }) {
  const autoAdvanceTimeoutRef = useRef(null);
  const hasAutoAdvancedRef = useRef(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Auto-advance when company name is filled
  useEffect(() => {
    // Clear any existing timeout
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
    }

    const companyName = formData.companyName?.trim();
    const hasRequiredField = companyName && companyName.length > 0;

    // Only auto-advance if we haven't already and required field is filled
    if (hasRequiredField && !hasAutoAdvancedRef.current && onAutoAdvance) {
      // Wait 1 second after typing stops
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        // Validate before advancing
        if (companyName && companyName.length > 0) {
          hasAutoAdvancedRef.current = true;
          onAutoAdvance();
        }
      }, 1000);
    }

    // Reset auto-advance flag if field becomes empty
    if (!hasRequiredField) {
      hasAutoAdvancedRef.current = false;
    }

    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, [formData.companyName, onAutoAdvance]);

  return (
    <div className="space-y-4 sm:space-y-6 py-2 sm:py-4 max-w-2xl mx-auto px-2 sm:px-0">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Tell us about yourself or your company
        </h2>
        <p className={`text-xs sm:text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          Basic information about you or your business
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <Label htmlFor="companyName" className={`text-sm sm:text-base ${isDark ? 'text-white' : 'text-black/90'}`}>
            Your name *
          </Label>
          <Input
            id="companyName"
            name="companyName"
            type="text"
            value={formData.companyName || ''}
            onChange={handleChange}
            placeholder="Your name or company name"
            className={`about-devello-glass w-full px-4 py-2.5 sm:py-3 rounded-xl border text-sm sm:text-base ${
              errors.companyName ? 'border-red-500' : ''
            } ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-400'}`}
            style={{
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              borderColor: errors.companyName 
                ? 'rgba(239, 68, 68, 0.5)' 
                : (isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)')
            }}
          />
          {errors.companyName && (
            <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.companyName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="yearsExperience" className={`text-sm sm:text-base ${isDark ? 'text-white' : 'text-black/90'}`}>
            Years of Experience
          </Label>
          <select
            id="yearsExperience"
            name="yearsExperience"
            value={formData.yearsExperience || ''}
            onChange={handleChange}
            className={`about-devello-glass w-full px-4 py-2.5 sm:py-3 rounded-xl border transition-all text-sm sm:text-base ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
            style={{
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
              colorScheme: isDark ? 'dark' : 'light'
            }}
          >
            <option value="" style={isDark ? { backgroundColor: '#1f2937', color: '#ffffff' } : {}}>Select years</option>
            {YEARS_IN_BUSINESS.map(years => (
              <option 
                key={years} 
                value={years}
                style={isDark ? { backgroundColor: '#1f2937', color: '#ffffff' } : {}}
              >
                {years}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// Step 3: Services & Offerings
function ServicesStep({ isDark, formData, setFormData, errors, setErrors, onAutoAdvance }) {
  const autoAdvanceTimeoutRef = useRef(null);
  const hasAutoAdvancedRef = useRef(false);
  const handleSubserviceToggle = (subservice) => {
    setFormData(prev => {
      const current = prev.subservices || [];
      const updated = current.includes(subservice)
        ? current.filter(s => s !== subservice)
        : [...current, subservice];
      
      // Clear materials and products when subservice is removed
      const newMaterials = prev.materials || [];
      const newProducts = prev.products || [];
      
      // If removing a subservice, remove its associated materials
      if (!updated.includes(subservice)) {
        const subserviceMaterials = SUBERVICE_MATERIALS[subservice] || [];
        const filteredMaterials = newMaterials.filter(m => !subserviceMaterials.includes(m));
        return { 
          ...prev, 
          subservices: updated,
          materials: filteredMaterials,
          products: [] // Reset products when materials change
        };
      }
      
      return { ...prev, subservices: updated };
    });
  };

  const handleMaterialToggle = (material) => {
    setFormData(prev => {
      const current = prev.materials || [];
      const updated = current.includes(material)
        ? current.filter(m => m !== material)
        : [...current, material];
      
      // Update available products based on selected materials
      const availableProducts = getAvailableProducts(updated);
      const currentProducts = prev.products || [];
      // Keep only products that are still available
      const validProducts = currentProducts.filter(p => availableProducts.includes(p));
      
      return { 
        ...prev, 
        materials: updated,
        products: validProducts
      };
    });
  };

  const handleProductToggle = (product) => {
    setFormData(prev => {
      const current = prev.products || [];
      const updated = current.includes(product)
        ? current.filter(p => p !== product)
        : [...current, product];
      return { ...prev, products: updated };
    });
  };

  const availableSubservices = formData.serviceType ? SUBSERVICES[formData.serviceType] || [] : [];
  const selectedSubservices = formData.subservices || [];
  
  // Get all available materials for selected subservices
  const getAvailableMaterials = () => {
    const materials = new Set();
    selectedSubservices.forEach(subservice => {
      const subMaterials = SUBERVICE_MATERIALS[subservice] || [];
      subMaterials.forEach(m => materials.add(m));
    });
    return Array.from(materials).sort();
  };

  const availableMaterials = getAvailableMaterials();
  const selectedMaterials = formData.materials || [];
  const availableProducts = getAvailableProducts(selectedMaterials);
  const selectedProducts = formData.products || [];

  const isManufacturing = formData.serviceType === 'manufacturing';

  // Auto-advance when all required selections are made
  useEffect(() => {
    // Clear any existing timeout
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
    }

    // Check if all required fields are filled
    const hasSubservices = selectedSubservices.length > 0;
    const hasMaterials = !isManufacturing || selectedMaterials.length > 0;
    
    // Only auto-advance if we haven't already and all requirements are met
    if (hasSubservices && hasMaterials && !hasAutoAdvancedRef.current && onAutoAdvance) {
      // Wait 1.5 seconds after last selection to allow user to see their choices
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        // Validate before advancing
        const newErrors = {};
        if (!hasSubservices) {
          newErrors.subservices = 'Please select at least one subservice';
        }
        if (isManufacturing && !hasMaterials) {
          newErrors.materials = 'Please select at least one material you work with';
        }
        
        if (Object.keys(newErrors).length === 0) {
          hasAutoAdvancedRef.current = true;
          onAutoAdvance();
        }
      }, 1500);
    }

    // Reset auto-advance flag if selections change
    if (!hasSubservices || !hasMaterials) {
      hasAutoAdvancedRef.current = false;
    }

    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, [selectedSubservices, selectedMaterials, isManufacturing, onAutoAdvance]);

  // Reset auto-advance flag when component mounts or formData changes significantly
  useEffect(() => {
    hasAutoAdvancedRef.current = false;
  }, [formData.serviceType]);

  return (
    <div className="space-y-4 sm:space-y-6 py-2 sm:py-4 max-w-2xl mx-auto px-2 sm:px-0">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Services & Offerings
        </h2>
        <p className={`text-xs sm:text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          {isManufacturing 
            ? 'Select your services, materials, and product offerings'
            : 'What services do you offer?'}
        </p>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {availableSubservices.length > 0 && (
          <div>
            <Label className={`text-sm sm:text-base ${isDark ? 'text-white' : 'text-black/90'}`}>
              Subservices (select all that apply) *
            </Label>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-2.5 mt-2">
              {availableSubservices.map((subservice) => (
                <motion.button
                  key={subservice}
                  type="button"
                  onClick={() => handleSubserviceToggle(subservice)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={`about-devello-glass px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm transition-all w-full sm:w-auto sm:flex-shrink-0 ${
                    selectedSubservices.includes(subservice)
                      ? isDark
                        ? 'text-white border-2'
                        : 'text-gray-900 border-2'
                      : isDark
                      ? 'text-white/70 border hover:text-white'
                      : 'text-gray-700 border hover:text-gray-900'
                  }`}
                  style={{
                    backdropFilter: 'blur(2px)',
                    WebkitBackdropFilter: 'blur(2px)',
                    backgroundColor: selectedSubservices.includes(subservice)
                      ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)')
                      : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                    borderColor: selectedSubservices.includes(subservice)
                      ? (isDark ? 'rgba(96, 165, 250, 0.5)' : 'rgba(59, 130, 246, 0.4)')
                      : (isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)')
                  }}
                >
                  {subservice}
                </motion.button>
              ))}
            </div>
            {errors.subservices && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.subservices}</p>
            )}
          </div>
        )}

        {/* Materials selection - only for manufacturing */}
        {isManufacturing && availableMaterials.length > 0 && (
          <div>
            <Label className={`text-sm sm:text-base ${isDark ? 'text-white' : 'text-black/90'}`}>
              Materials You Work With (select all that apply) *
            </Label>
            <p className={`text-xs mt-1 mb-2 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
              Select the materials you work with based on your selected subservices
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5 mt-2">
              {availableMaterials.map((material) => (
                <motion.button
                  key={material}
                  type="button"
                  onClick={() => handleMaterialToggle(material)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={`about-devello-glass px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm transition-all ${
                    selectedMaterials.includes(material)
                      ? isDark
                        ? 'text-white border-2'
                        : 'text-gray-900 border-2'
                      : isDark
                      ? 'text-white/70 border hover:text-white'
                      : 'text-gray-700 border hover:text-gray-900'
                  }`}
                  style={{
                    backdropFilter: 'blur(2px)',
                    WebkitBackdropFilter: 'blur(2px)',
                    backgroundColor: selectedMaterials.includes(material)
                      ? (isDark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(52, 211, 153, 0.15)')
                      : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                    borderColor: selectedMaterials.includes(material)
                      ? (isDark ? 'rgba(110, 231, 183, 0.5)' : 'rgba(52, 211, 153, 0.4)')
                      : (isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)')
                  }}
                >
                  {material}
                </motion.button>
              ))}
            </div>
            {errors.materials && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.materials}</p>
            )}
          </div>
        )}

        {/* Products selection - only for manufacturing with materials selected */}
        {isManufacturing && selectedMaterials.length > 0 && availableProducts.length > 0 && (
          <div>
            <Label className={`text-sm sm:text-base ${isDark ? 'text-white' : 'text-black/90'}`}>
              Product Offerings (select all that apply)
            </Label>
            <p className={`text-xs mt-1 mb-2 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
              Based on your selected materials, select the products you can offer
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-2">
              {availableProducts.map((product) => (
                <motion.button
                  key={product}
                  type="button"
                  onClick={() => handleProductToggle(product)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={`about-devello-glass px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm transition-all text-left ${
                    selectedProducts.includes(product)
                      ? isDark
                        ? 'text-white border-2'
                        : 'text-gray-900 border-2'
                      : isDark
                      ? 'text-white/70 border hover:text-white'
                      : 'text-gray-700 border hover:text-gray-900'
                  }`}
                  style={{
                    backdropFilter: 'blur(2px)',
                    WebkitBackdropFilter: 'blur(2px)',
                    backgroundColor: selectedProducts.includes(product)
                      ? (isDark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(52, 211, 153, 0.15)')
                      : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                    borderColor: selectedProducts.includes(product)
                      ? (isDark ? 'rgba(110, 231, 183, 0.5)' : 'rgba(52, 211, 153, 0.4)')
                      : (isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)')
                  }}
                >
                  {product}
                </motion.button>
              ))}
            </div>
            {errors.products && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.products}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Step 4: Contact Information
function ContactStep({ isDark, formData, setFormData, errors, setErrors }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 py-2 sm:py-4 max-w-2xl mx-auto px-2 sm:px-0">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Contact Information
        </h2>
        <p className={`text-xs sm:text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          How can we reach you?
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <Label htmlFor="phone" className={`text-sm sm:text-base ${isDark ? 'text-white' : 'text-black/90'}`}>
            Phone Number
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={handleChange}
            placeholder="+1 (555) 123-4567"
            className={`about-devello-glass w-full px-4 py-2.5 sm:py-3 rounded-xl border text-sm sm:text-base ${
              errors.phone ? 'border-red-500' : ''
            } ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-400'}`}
            style={{
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              borderColor: errors.phone 
                ? 'rgba(239, 68, 68, 0.5)' 
                : (isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)')
            }}
          />
          {errors.phone && (
            <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.phone}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 5: Review & Submit
function ReviewStep({ isDark, formData, onSubmit, loading }) {
  const getIndustryLabel = (id) => {
    return INDUSTRIES.find(i => i.id === id)?.label || id;
  };

  return (
    <div className="space-y-4 sm:space-y-6 py-2 sm:py-4 max-w-2xl mx-auto px-2 sm:px-0">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Review Your Application
        </h2>
        <p className={`text-xs sm:text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          Please review your information before submitting
        </p>
      </div>

      <div className={`about-devello-glass space-y-3 sm:space-y-4 p-4 sm:p-6 rounded-2xl border`}
      style={{
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)'
      }}
      >
        <div>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Industry</p>
          <p className={`text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{getIndustryLabel(formData.serviceType)}</p>
        </div>

        <div>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Name</p>
          <p className={`text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{formData.companyName}</p>
        </div>

        {formData.yearsExperience && (
          <div>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Years of Experience</p>
            <p className={`text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{formData.yearsExperience}</p>
          </div>
        )}

        {formData.subservices && formData.subservices.length > 0 && (
          <div>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Subservices</p>
            <p className={`text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{formData.subservices.join(', ')}</p>
          </div>
        )}

        {formData.materials && formData.materials.length > 0 && (
          <div>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Materials</p>
            <p className={`text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{formData.materials.join(', ')}</p>
          </div>
        )}

        {formData.products && formData.products.length > 0 && (
          <div>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Product Offerings</p>
            <p className={`text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{formData.products.join(', ')}</p>
          </div>
        )}

        {formData.phone && (
          <div>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Phone</p>
            <p className={`text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{formData.phone}</p>
          </div>
        )}
      </div>

      <div className="flex justify-center pt-4">
        <Button
          onClick={onSubmit}
          disabled={loading}
          className={`about-devello-glass w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl border transition-all text-sm sm:text-base ${
            isDark
              ? 'text-white border-2'
              : 'text-gray-900 border-2'
          }`}
          style={{
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)'
          }}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting...</span>
            </div>
          ) : (
            'Submit Application'
          )}
        </Button>
      </div>
    </div>
  );
}

// Main Component
export default function PartnerIntakeForm({ isOpen, onClose, onSuccess }) {
  const { isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    serviceType: '',
    companyName: '',
    entityType: '',
    yearsExperience: '',
    employeeCount: '',
    subservices: [],
    materials: [],
    products: [],
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);


  const validateStep = (step, overrideData = null) => {
    const newErrors = {};
    const dataToValidate = overrideData || formData;

    if (step === 0) {
      const serviceType = overrideData?.serviceType || dataToValidate.serviceType;
      if (!serviceType) {
        newErrors.serviceType = 'Please select an industry';
      }
    } else if (step === 1) {
      const companyName = overrideData?.companyName || dataToValidate.companyName;
      if (!companyName?.trim()) {
        newErrors.companyName = 'Your name is required';
      }
    } else if (step === 2) {
      // Validate Services step
      const subservices = overrideData?.subservices || dataToValidate.subservices;
      const serviceType = overrideData?.serviceType || dataToValidate.serviceType;
      const materials = overrideData?.materials || dataToValidate.materials;
      
      if (!subservices || subservices.length === 0) {
        newErrors.subservices = 'Please select at least one subservice';
      }
      // For manufacturing, validate materials
      if (serviceType === 'manufacturing') {
        if (!materials || materials.length === 0) {
          newErrors.materials = 'Please select at least one material you work with';
        }
      }
    } else if (step === 3) {
      // Validate Contact step - phone is optional but must be valid if provided
      if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStepChange = (step) => {
    if (step > currentStep) {
      // Validate before moving forward
      if (!validateStep(currentStep)) {
        // Prevent step change if validation fails
        return;
      }
    }
    setCurrentStep(step);
    setErrors({});
  };

  const handleStepNext = async (step) => {
    if (!validateStep(step)) {
      return false;
    }
    return true;
  };

  // For steps 0 and 1, the Stepper auto-advances, so we need to validate in handleStepChange
  // and prevent the step change if validation fails by not updating currentStep
  const handleStepChangeWithValidation = (step, overrideData = null) => {
    if (step > currentStep) {
      // Validate before moving forward with override data if provided
      if (!validateStep(currentStep, overrideData)) {
        // Don't update currentStep - this prevents the step change
        // The Stepper's internal state will be out of sync, but externalStep will keep it in sync
        return;
      }
    }
    setCurrentStep(step);
    setErrors({});
  };

  // Centralized auto-advance handler
  const handleAutoAdvance = (stepIndex, overrideData = null) => {
    const nextStep = stepIndex + 1;
    handleStepChangeWithValidation(nextStep, overrideData);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Not authenticated. Please sign in to submit an application.');
      }

      // Map formData to API format
      const applicationData = {
        companyName: formData.companyName,
        serviceType: formData.serviceType,
        yearsExperience: formData.yearsExperience || null,
        phone: formData.phone || null,
        // Additional fields for extended intake
        entityType: formData.entityType || null,
        employeeCount: formData.employeeCount || null,
        subservices: formData.subservices || [],
        materials: formData.materials || [],
        products: formData.products || []
      };

      const response = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(applicationData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'Application already exists') {
          setErrors({ submit: `You already have a ${data.status} application.` });
        } else {
          setErrors({ submit: data.error || 'Failed to submit application. Please try again.' });
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
      
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Application submission error:', error);
      setErrors({ submit: error.message || 'Failed to submit application. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setErrors({});
    setFormData({
      serviceType: '',
      companyName: '',
      entityType: '',
      yearsExperience: '',
      employeeCount: '',
      subservices: [],
      materials: [],
      products: [],
      phone: ''
    });
    setCurrentStep(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4 md:px-6 pt-16 sm:pt-20 md:pt-28"
        style={{
          background: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          margin: 0,
          paddingTop: '4rem',
          paddingLeft: 0,
          paddingRight: 0,
          paddingBottom: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`about-devello-glass relative w-full max-w-4xl max-h-[calc(100vh-5rem)] sm:max-h-[calc(100vh-7rem)] rounded-3xl border mx-2 sm:mx-4 overflow-hidden ${
            isDark 
              ? 'text-white border-white/20' 
              : 'text-gray-900 border-white/30'
          }`}
          style={{
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            backgroundColor: isDark 
              ? 'rgba(255, 255, 255, 0.15)' 
              : 'rgba(255, 255, 255, 0.7)',
            borderColor: isDark 
              ? 'rgba(255, 255, 255, 0.25)' 
              : 'rgba(0, 0, 0, 0.1)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.button
            onClick={handleClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`about-devello-glass absolute top-3 -right-3 sm:top-4 sm:-right-3 p-2 rounded-full transition-colors z-50 ${
              isDark ? 'text-white hover:bg-white/20' : 'text-gray-600 hover:bg-white/90'
            }`}
            style={{
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.7)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)'
            }}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
          <div className="overflow-y-auto max-h-[calc(100vh-5rem)] sm:max-h-[calc(100vh-7rem)] h-full">
            <div className="p-4 sm:p-6 md:p-8">

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`about-devello-glass p-4 sm:p-6 rounded-2xl text-center border ${
                  isDark 
                    ? 'bg-green-500/15 border-green-500/30' 
                    : 'bg-green-50/80 border-green-200/60'
                }`}
                style={{
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                }}
              >
                <div className="mb-3 sm:mb-4">
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-green-500" />
                </div>
                <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Application Submitted!
                </h3>
                <p className={`text-sm sm:text-base ${
                  isDark ? 'text-white/70' : 'text-gray-600'
                }`}>
                  We've received your application and will review it shortly. You'll be notified once a decision has been made.
                </p>
              </motion.div>
            ) : (
              <>
                {errors.submit && (
                  <div className={`about-devello-glass p-3 border rounded-xl text-xs sm:text-sm mb-4 ${
                    isDark 
                      ? 'bg-red-500/15 border-red-500/30 text-red-400' 
                      : 'bg-red-50/80 border-red-200/60 text-red-600'
                  }`}
                  style={{
                    backdropFilter: 'blur(2px)',
                    WebkitBackdropFilter: 'blur(2px)',
                  }}
                  >
                    {errors.submit}
                  </div>
                )}

                <Stepper
                  initialStep={0}
                  onStepChange={handleStepChangeWithValidation}
                  externalStep={currentStep}
                  onStep2Next={() => handleStepNext(2)}
                  onStep3Next={() => handleStepNext(3)}
                  backButtonText="Back"
                  nextButtonText="Continue"
                >
                  <Step>
                    <IndustryStep
                      isDark={isDark}
                      formData={formData}
                      setFormData={setFormData}
                      errors={errors}
                      setErrors={setErrors}
                      onAutoAdvance={(industryId) => {
                        // Validate with the selected industry directly
                        const tempData = { ...formData, serviceType: industryId };
                        handleAutoAdvance(0, tempData);
                      }}
                    />
                  </Step>
                  <Step>
                    <CompanyStep
                      isDark={isDark}
                      formData={formData}
                      setFormData={setFormData}
                      errors={errors}
                      setErrors={setErrors}
                      onAutoAdvance={() => {
                        // Validate with current form data
                        handleAutoAdvance(1);
                      }}
                    />
                  </Step>
                  <Step>
                    <ServicesStep
                      isDark={isDark}
                      formData={formData}
                      setFormData={setFormData}
                      errors={errors}
                      setErrors={setErrors}
                      onAutoAdvance={() => {
                        handleAutoAdvance(2);
                      }}
                    />
                  </Step>
                  <Step>
                    <ContactStep
                      isDark={isDark}
                      formData={formData}
                      setFormData={setFormData}
                      errors={errors}
                      setErrors={setErrors}
                    />
                  </Step>
                  <Step>
                    <ReviewStep
                      isDark={isDark}
                      formData={formData}
                      onSubmit={handleSubmit}
                      loading={loading}
                    />
                  </Step>
                </Stepper>
              </>
            )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

