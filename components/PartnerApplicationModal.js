import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './Layout';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Button } from './ui/Button';
import { getSupabase } from '../lib/supabaseClient';
import { useModalStatusBar } from '../lib/useStatusBar';

export default function PartnerApplicationModal({ isOpen, onClose, onSuccess }) {
  const { isDark } = useTheme();
  
  // Sync status bar with modal state
  useModalStatusBar(isDark, isOpen);
  const [formData, setFormData] = useState({
    companyName: '',
    serviceType: '',
    yearsExperience: '',
    description: '',
    phone: '',
    portfolioUrl: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const serviceTypes = [
    { value: 'construction', label: 'Construction Services' },
    { value: 'software_dev', label: 'Software Development' },
    { value: 'consulting', label: 'Business Consultation' }
  ];

  // Normalize URL to ensure it has a protocol
  const normalizeUrl = (url) => {
    if (!url || !url.trim()) return null;
    
    let normalized = url.trim();
    
    // Remove any leading/trailing whitespace
    normalized = normalized.trim();
    
    // Remove spaces
    normalized = normalized.replace(/\s/g, '');
    
    // If it doesn't start with http:// or https://, add https://
    if (!/^https?:\/\//i.test(normalized)) {
      // Preserve www. if present, just add the protocol
      normalized = `https://${normalized}`;
    }
    
    // Ensure it's a valid URL format
    try {
      new URL(normalized);
      return normalized;
    } catch (e) {
      // If URL constructor fails, return null (validation should catch invalid URLs)
      return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.serviceType) {
      newErrors.serviceType = 'Please select a service type';
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // URL validation (optional but if provided, should be a valid domain/URL format)
    if (formData.portfolioUrl && formData.portfolioUrl.trim()) {
      // Accept various formats: domain.com, www.domain.com, http://domain.com, https://domain.com
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      const domainPattern = /^([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      
      const trimmedUrl = formData.portfolioUrl.trim();
      if (!urlPattern.test(trimmedUrl) && !domainPattern.test(trimmedUrl)) {
        newErrors.portfolioUrl = 'Please enter a valid website URL (e.g., yourcompany.com or https://yourcompany.com)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Get Supabase session token
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Not authenticated. Please sign in to submit an application.');
      }

      // Normalize portfolio URL before submitting
      const normalizedPortfolioUrl = formData.portfolioUrl 
        ? normalizeUrl(formData.portfolioUrl) 
        : null;

      // If URL normalization failed, show error
      if (formData.portfolioUrl && !normalizedPortfolioUrl) {
        setErrors({ submit: 'Invalid website URL format. Please check and try again.' });
        setLoading(false);
        return;
      }

      // Call the API endpoint
      const response = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          serviceType: formData.serviceType,
          yearsExperience: formData.yearsExperience || null,
          description: formData.description || null,
          phone: formData.phone || null,
          portfolioUrl: normalizedPortfolioUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors
        if (data.error === 'Application already exists') {
          setErrors({ submit: `You already have a ${data.status} application.` });
        } else {
          setErrors({ submit: data.error || 'Failed to submit application. Please try again.' });
        }
        return;
      }

      // Success!
      setSuccess(true);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after 2 seconds
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
      companyName: '',
      serviceType: '',
      yearsExperience: '',
      description: '',
      phone: '',
      portfolioUrl: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Blurred Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[9998]"
        onClick={handleClose}
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor: 'transparent',
        }}
      />
      
      {/* Modal Container */}
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center px-6 sm:px-0"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-[2rem] sm:rounded-2xl border mx-4 sm:mx-0 ${
            isDark 
              ? 'text-white border-white/10' 
              : 'text-gray-900 border-gray-200'
          }`}
          style={{
            background: isDark 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            <button
              onClick={handleClose}
              className={`absolute top-4 right-4 p-2 rounded-[2rem] sm:rounded-lg transition-colors ${
                isDark ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <h2 className={`text-2xl font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Apply to Become a Partner
              </h2>
              <p className={`text-sm ${
                isDark ? 'text-white/70' : 'text-gray-600'
              }`}>
                Join the Devello partner network and expand your business
              </p>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                    className={`p-6 rounded-[2rem] sm:rounded-xl text-center ${
                  isDark 
                    ? 'bg-green-500/10 border border-green-500/20' 
                    : 'bg-green-50 border border-green-200'
                }`}
              >
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Application Submitted!
                </h3>
                <p className={`${
                  isDark ? 'text-white/70' : 'text-gray-600'
                }`}>
                  We've received your application and will review it shortly. You'll be notified once a decision has been made.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Company Name */}
                <div>
                  <Label htmlFor="companyName" className={isDark ? 'text-white' : 'text-black/90'}>
                    Company Name *
                  </Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    placeholder="Your Company Name"
                    className={errors.companyName ? 'border-red-500' : ''}
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-500">{errors.companyName}</p>
                  )}
                </div>

                {/* Service Type */}
                <div>
                  <Label htmlFor="serviceType" className={isDark ? 'text-white' : 'text-black/90'}>
                    Service Type *
                  </Label>
                  <select
                    id="serviceType"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 rounded-[2rem] sm:rounded-lg border transition-all duration-300 ${
                      isDark
                        ? 'bg-white/5 border-white/20 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } ${errors.serviceType ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select a service type</option>
                    {serviceTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.serviceType && (
                    <p className="mt-1 text-sm text-red-500">{errors.serviceType}</p>
                  )}
                </div>

                {/* Years of Experience */}
                <div>
                  <Label htmlFor="yearsExperience" className={isDark ? 'text-white' : 'text-black/90'}>
                    Years of Experience
                  </Label>
                  <Input
                    id="yearsExperience"
                    name="yearsExperience"
                    type="number"
                    min="0"
                    value={formData.yearsExperience}
                    onChange={handleChange}
                    placeholder="e.g., 5"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className={isDark ? 'text-white' : 'text-black/90'}>
                    Description
                  </Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell us about your company and services..."
                    className={`w-full px-4 py-2 rounded-lg border transition-all duration-300 resize-none ${
                      isDark
                        ? 'bg-white/5 border-white/20 text-white placeholder-white/40'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone" className={isDark ? 'text-white' : 'text-black/90'}>
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>

                {/* Portfolio URL */}
                <div>
                  <Label htmlFor="portfolioUrl" className={isDark ? 'text-white' : 'text-black/90'}>
                    Portfolio/Website URL
                  </Label>
                  <Input
                    id="portfolioUrl"
                    name="portfolioUrl"
                    type="text"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                    placeholder="yourcompany.com or https://yourcompany.com"
                    className={errors.portfolioUrl ? 'border-red-500' : ''}
                  />
                  <p className={`mt-1 text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    You can enter just the domain (e.g., yourcompany.com) or a full URL. We'll add https:// automatically if needed.
                  </p>
                  {errors.portfolioUrl && (
                    <p className="mt-1 text-sm text-red-500">{errors.portfolioUrl}</p>
                  )}
                </div>

                {errors.submit && (
                  <div className={`p-3 border rounded-[2rem] sm:rounded-lg text-sm ${
                    isDark 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                      : 'bg-red-50 border-red-200 text-red-600'
                  }`}>
                    {errors.submit}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Submitting...
                      </div>
                    ) : (
                      'Submit Application'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

