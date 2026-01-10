import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SEOComponent from '../components/SEO';
import { useTheme } from '../components/Layout';

export default function Contact() {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website: '' // Honeypot field - should remain empty
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('sales@develloinc.com');
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy email:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/contact/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Thank you for your message! We\'ll get back to you soon.');
        setIsSuccess(true);
        setFormData({ name: '', email: '', subject: '', message: '', website: '' });
        
        // Track conversion
        if (typeof window !== 'undefined' && typeof gtag_report_conversion === 'function') {
          gtag_report_conversion();
        }
      } else {
        setMessage(data.error || 'Failed to send message. Please try again.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setMessage('Failed to send message. Please try again.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEOComponent 
        title="Contact Devello Inc – Support & Customer Service"
        description="Contact Devello Inc for support, questions, or inquiries about our construction services, software development, AI tools, or products. Get help from our expert team."
        keywords="contact devello, devello support, devello customer service, devello contact, devello inc contact, devello help"
        url="https://develloinc.com/contact"
        breadcrumbs={[
          { name: "Home", url: "https://develloinc.com" },
          { name: "Contact", url: "https://develloinc.com/contact" }
        ]}
      />

      <div className={`min-h-screen py-6 sm:py-12 pb-24 sm:pb-32 transition-colors duration-700 ${
        isDark ? 'bg-black text-white' : 'bg-[var(--light-bg)] text-gray-900'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Get in Touch Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center pt-16 sm:pt-24 mb-8 sm:mb-12"
          >
            <h1 className={`text-3xl sm:text-4xl font-light mb-3 sm:mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Contact Devello Inc
            </h1>
            <p className={`text-sm sm:text-lg mb-6 sm:mb-8 px-4 ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              Contact support for assistance with our AI tools
            </p>
          </motion.div>

          {/* Contact Support Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-4xl mx-auto"
          >
            <div className={`p-4 sm:p-6 lg:p-8 rounded-2xl ${
              isDark 
                ? 'bg-white/5 border border-white/10' 
                : 'bg-white border border-gray-200'
            }`}
            style={{ backdropFilter: 'blur(10px)' }}
            >

              {/* Email Support Message */}
              <div className={`p-4 sm:p-6 rounded-lg border mt-2 sm:mt-4 mb-6 sm:mb-8 text-center ${
                isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
              }`}>
                <div>
                    <h3 className={`text-base sm:text-lg font-semibold mb-2 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Email Support
                    </h3>
                    <p className={`text-sm sm:text-base mb-3 px-2 ${
                      isDark ? 'text-white/80' : 'text-gray-600'
                    }`}>
                      For subscription and payment support, please send us an email at:
                    </p>
                    <div className="relative">
                      <div 
                        className={`inline-flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-mono text-xs sm:text-sm cursor-pointer transition-all duration-200 touch-manipulation ${
                          isDark 
                            ? 'bg-gray-800 text-green-400 border border-gray-700 hover:bg-gray-700 active:bg-gray-600' 
                            : 'bg-gray-100 text-green-600 border border-gray-300 hover:bg-gray-200 active:bg-gray-300'
                        }`}
                        onClick={handleCopyEmail}
                        title="Click to copy email"
                      >
                        <span className="break-all">sales@develloinc.com</span>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      
                      {/* Success Popup */}
                      {showCopySuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          className={`absolute -top-10 sm:-top-12 left-1/2 transform -translate-x-1/2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs font-medium ${
                            isDark 
                              ? 'bg-green-600 text-white' 
                              : 'bg-green-500 text-white'
                          }`}
                        >
                          ✓ Copied!
                        </motion.div>
                      )}
                    </div>
                    <p className={`text-xs sm:text-sm mt-3 px-2 ${
                      isDark ? 'text-white/60' : 'text-gray-500'
                    }`}>
                      Or use the form below to send us a message directly.
                    </p>
                  </div>
              </div>

              {/* Contact Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className={`block text-sm sm:text-base font-medium mb-2 ${
                      isDark ? 'text-white/80' : 'text-gray-700'
                    }`}>
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border transition-all duration-300 text-sm sm:text-base ${
                        isDark
                          ? 'bg-white/5 border-white/20 text-white placeholder-white/50 focus:border-white/40'
                          : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-amber-400'
                      }`}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm sm:text-base font-medium mb-2 ${
                      isDark ? 'text-white/80' : 'text-gray-700'
                    }`}>
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border transition-all duration-300 text-sm sm:text-base ${
                        isDark
                          ? 'bg-white/5 border-white/20 text-white placeholder-white/50 focus:border-white/40'
                          : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-amber-400'
                      }`}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm sm:text-base font-medium mb-2 ${
                    isDark ? 'text-white/80' : 'text-gray-700'
                  }`}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border transition-all duration-300 text-sm sm:text-base ${
                      isDark
                        ? 'bg-white/5 border-white/20 text-white placeholder-white/50 focus:border-white/40'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-amber-400'
                    }`}
                    placeholder="What can we help you with?"
                  />
                </div>

                <div>
                  <label className={`block text-sm sm:text-base font-medium mb-2 ${
                    isDark ? 'text-white/80' : 'text-gray-700'
                  }`}>
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border transition-all duration-300 resize-none text-sm sm:text-base ${
                      isDark
                        ? 'bg-white/5 border-white/20 text-white placeholder-white/50 focus:border-white/40'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-amber-400'
                    }`}
                    placeholder="Please describe your question or issue..."
                  />
                </div>

                {/* Honeypot field - hidden from users but visible to bots */}
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
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

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${
                    isDark
                      ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ backdropFilter: 'blur(10px)' }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-current mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Message'
                  )}
                </motion.button>

                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs sm:text-sm text-center p-2 sm:p-3 rounded-lg ${
                      isSuccess
                        ? isDark
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-green-100 text-green-700 border border-green-300'
                        : isDark
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-red-100 text-red-700 border border-red-300'
                    }`}
                  >
                    {message}
                  </motion.div>
                )}
              </form>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}
