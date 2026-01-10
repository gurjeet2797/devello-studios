import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from './auth/AuthProvider';
import { getSupabase } from '../lib/supabaseClient';

const SUBSERVICES = {
  construction: ['General Build', 'Interior Renovation', 'Electrical/Plumbing', 'Design Firm', 'Architecture Firm', 'Engineering Firm'],
  consulting: ['Build a business', 'Expand existing business', 'Finance Consultation', 'Compliance'],
  software_development: ['Web Apps', 'Mobile Apps', 'AI/ML', 'Data', 'DevOps'],
  software: ['Web Apps', 'Mobile Apps', 'AI/ML', 'Data', 'DevOps'],
  manufacturing: ['CNC', '3D Printing', 'Molding', 'Sheet Metal', 'Assembly', 'Fabrication']
};

export default function PartnerMessageModal({ partner, isDark, onClose, onMessageSent }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    senderName: '',
    senderEmail: '',
    subservice: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [partnerSubservices, setPartnerSubservices] = useState([]);
  const [loadingSubservices, setLoadingSubservices] = useState(true);

  // Fetch partner subservices when modal opens
  useEffect(() => {
    const fetchPartnerSubservices = async () => {
      if (!partner?.id) {
        setLoadingSubservices(false);
        return;
      }

      try {
        setLoadingSubservices(true);
        const response = await fetch(`/api/partners/${partner.id}`);
        if (response.ok) {
          const data = await response.json();
          setPartnerSubservices(data.partner?.subservices || []);
        } else {
          console.error('Failed to fetch partner subservices');
          setPartnerSubservices([]);
        }
      } catch (error) {
        console.error('Error fetching partner subservices:', error);
        setPartnerSubservices([]);
      } finally {
        setLoadingSubservices(false);
      }
    };

    fetchPartnerSubservices();
  }, [partner?.id]);

  // Auto-populate from Google profile
  useEffect(() => {
    if (user) {
      // Get name from user metadata
      const fullName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      (user.user_metadata?.given_name && user.user_metadata?.family_name 
                        ? `${user.user_metadata.given_name} ${user.user_metadata.family_name}` 
                        : '');
      
      setFormData(prev => ({
        ...prev,
        senderName: fullName || prev.senderName,
        senderEmail: user.email || prev.senderEmail
      }));
    }
  }, [user]);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubserviceSelect = (subservice) => {
    setFormData(prev => ({
      ...prev,
      subservice: prev.subservice === subservice ? '' : subservice
    }));
    if (errors.subservice) {
      setErrors(prev => ({ ...prev, subservice: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.senderName.trim()) {
      newErrors.senderName = 'Name is required';
    }
    if (!formData.senderEmail.trim()) {
      newErrors.senderEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.senderEmail)) {
      newErrors.senderEmail = 'Please enter a valid email address';
    }
    if (!formData.subservice.trim()) {
      newErrors.subservice = 'Please select a service type';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get auth token if user is signed in
      let authHeader = null;
      if (user) {
        const supabase = getSupabase();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            authHeader = `Bearer ${session.access_token}`;
          }
        }
      }

      const response = await fetch('/api/partners/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { 'Authorization': authHeader })
        },
        body: JSON.stringify({
          partnerId: partner.id,
          senderName: formData.senderName,
          senderEmail: formData.senderEmail,
          subject: formData.subservice, // Use subservice as subject
          message: formData.message
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      setSubmitSuccess(true);
      // If user is signed in and conversation was created, they can access client portal
      if (user && result.conversationId) {
        // Show success for longer to allow user to see the link
        setTimeout(() => {
          onMessageSent();
        }, 5000);
      } else {
        setTimeout(() => {
          onMessageSent();
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setErrors(prev => ({
        ...prev,
        submission: error.message || 'Failed to send message. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-2xl rounded-[2rem] sm:rounded-2xl shadow-2xl about-devello-glass ${
            isDark ? 'border border-white/10' : 'border border-amber-200/30'
          }`}
          style={{
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
            backgroundColor: isDark 
              ? 'rgba(255, 255, 255, 0.15)' 
              : 'rgba(255, 255, 255, 0.7)',
            borderColor: isDark 
              ? 'rgba(255, 255, 255, 0.25)' 
              : 'rgba(0, 0, 0, 0.1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <Building2 className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Contact {partner.companyName}
                </h2>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                  Send a message to this partner
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-white/10 text-white/70 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  isDark ? 'bg-green-500/20' : 'bg-green-100'
                }`}>
                  <Send className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Message Sent!
                </h3>
                <p className={isDark ? 'text-white/70' : 'text-gray-600'}>
                  {user ? (
                    <>
                      Your message has been sent. You can view and manage all your conversations in the{' '}
                      <Link
                        href="/client-portal"
                        className="underline hover:opacity-80"
                        onClick={() => {
                          onMessageSent();
                        }}
                      >
                        Client Portal
                      </Link>
                      .
                    </>
                  ) : (
                    `Your message has been sent to ${partner.companyName}. They will get back to you soon.`
                  )}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Hidden Name and Email fields - still submitted with form */}
                <div className="hidden">
                  <input
                    type="text"
                    name="senderName"
                    value={formData.senderName}
                    onChange={handleInputChange('senderName')}
                  />
                  <input
                    type="email"
                    name="senderEmail"
                    value={formData.senderEmail}
                    onChange={handleInputChange('senderEmail')}
                  />
                </div>

                {/* Subservice Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    Service Type *
                  </label>
                  {loadingSubservices ? (
                    <div className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                      Loading services...
                    </div>
                  ) : partnerSubservices.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {partnerSubservices.map((subservice) => {
                        const isSelected = formData.subservice === subservice;
                        return (
                          <button
                            key={subservice}
                            type="button"
                            onClick={() => handleSubserviceSelect(subservice)}
                            className={`px-4 py-2 rounded-[2rem] sm:rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? isDark
                                  ? 'bg-blue-500/30 text-blue-300 border-2 border-blue-400/50'
                                  : 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                                : isDark
                                ? 'bg-gray-800/50 text-white/80 border-2 border-gray-600/50 hover:bg-gray-700/50 hover:border-gray-500/50'
                                : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                          >
                            {subservice}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                      No specific services available for this partner
                    </div>
                  )}
                  {errors.subservice && (
                    <p className="text-red-500 text-sm mt-2">{errors.subservice}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={handleInputChange('message')}
                    rows={6}
                    className={`w-full px-4 py-2 rounded-3xl border-2 transition-all resize-none ${
                      errors.message
                        ? 'border-red-500'
                        : isDark
                        ? 'bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500'
                        : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                    }`}
                    placeholder="Tell us about your project..."
                  />
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                  )}
                </div>

                {errors.submission && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-red-500 text-sm">{errors.submission}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className={`flex-1 px-4 py-2 rounded-3xl font-medium transition-all ${
                      isDark
                        ? 'bg-gray-800/50 text-white hover:bg-gray-700/50 border border-white/10'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={!isSubmitting ? { scale: 1.15 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.85, y: 2 } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className={`flex-1 px-4 py-2 rounded-3xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isSubmitting
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    } ${
                      isDark
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30 hover:bg-blue-500/30'
                        : 'bg-blue-500/20 text-blue-700 border border-blue-400/30 hover:bg-blue-500/30'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

