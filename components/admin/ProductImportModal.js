/**
 * Product Import Modal
 * 
 * UI for initiating product research jobs:
 * - PDF file upload
 * - Vendor URL input
 * - Text instructions
 * - Import settings
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../Layout';
import { getSupabase } from '../../lib/supabaseClient';
import {
  X,
  Upload,
  Link,
  FileText,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search
} from 'lucide-react';

export default function ProductImportModal({ isOpen, onClose, onComplete }) {
  const { isDark } = useTheme();
  const supabase = getSupabase();
  const fileInputRef = useRef(null);
  
  // Form state
  const [pdfFile, setPdfFile] = useState(null);
  const [vendorUrl, setVendorUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState('auto');
  const [generateSEO, setGenerateSEO] = useState(true);
  const [fetchImages, setFetchImages] = useState(true);
  const [markAsTest, setMarkAsTest] = useState(false);
  
  // Job state
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, starting, processing, completed, failed
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [productsFound, setProductsFound] = useState(0);
  const [errors, setErrors] = useState([]);
  const [totalCost, setTotalCost] = useState(null);
  const [costBreakdown, setCostBreakdown] = useState(null);
  
  // Polling ref
  const pollIntervalRef = useRef(null);

  /**
   * Get auth token
   */
  const getToken = async () => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  /**
   * Handle file selection
   */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setErrors(['Please select a PDF file']);
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setErrors(['PDF file must be less than 50MB']);
        return;
      }
      setPdfFile(file);
      setErrors([]);
    }
  };

  /**
   * Handle drag and drop
   */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type === 'application/pdf') {
      setPdfFile(file);
      setErrors([]);
    } else {
      setErrors(['Please drop a PDF file']);
    }
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  /**
   * Start the research job
   */
  const startResearch = async () => {
    // Validate inputs
    if (!pdfFile && !vendorUrl.trim() && !instructions.trim()) {
      setErrors(['Please provide at least one input: PDF, URL, or instructions']);
      return;
    }

    setStatus('starting');
    setErrors([]);
    setProgress(0);
    setMessage('Starting research job...');

    try {
      const token = await getToken();
      if (!token) {
        setErrors(['Authentication required']);
        setStatus('failed');
        return;
      }

      // Build form data
      const formData = new FormData();
      if (pdfFile) {
        formData.append('file', pdfFile);
      }
      if (vendorUrl.trim()) {
        formData.append('vendorUrl', vendorUrl.trim());
      }
      if (instructions.trim()) {
        formData.append('instructions', instructions.trim());
      }
      formData.append('category', category);
      formData.append('generateSEO', generateSEO.toString());
      formData.append('fetchImages', fetchImages.toString());
      formData.append('markAsTest', markAsTest.toString());

      const response = await fetch('/api/admin/product-research/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start research');
      }

      setJobId(data.jobId);
      setStatus('processing');
      setMessage('Job started, processing...');
      
      // Start polling for status
      startPolling(data.jobId, token);

    } catch (error) {
      console.error('Start research error:', error);
      setErrors([error.message]);
      setStatus('failed');
    }
  };

  /**
   * Poll for job status
   */
  const startPolling = (jobId, token) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const poll = async () => {
      try {
        const response = await fetch(`/api/admin/product-research/status/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get status');
        }

        setProgress(data.progress);
        setMessage(data.message);
        setProductsFound(data.productsFound || 0);
        setTotalCost(data.totalCost);
        setCostBreakdown(data.costBreakdown);
        
        if (data.errors?.length > 0) {
          setErrors(data.errors);
        }

        if (data.status === 'completed') {
          clearInterval(pollIntervalRef.current);
          setStatus('completed');
          onComplete?.(jobId);
        } else if (data.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          setStatus('failed');
        }

      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Poll immediately, then every 2 seconds
    poll();
    pollIntervalRef.current = setInterval(poll, 2000);
  };

  /**
   * Cleanup polling on unmount
   */
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  /**
   * Reset form
   */
  const resetForm = () => {
    setPdfFile(null);
    setVendorUrl('');
    setInstructions('');
    setCategory('auto');
    setGenerateSEO(true);
    setFetchImages(true);
    setMarkAsTest(false);
    setJobId(null);
    setStatus('idle');
    setProgress(0);
    setMessage('');
    setProductsFound(0);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle close
   */
  const handleClose = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    resetForm();
    onClose();
  };

  const categories = [
    { value: 'auto', label: 'Auto-detect' },
    { value: 'windows', label: 'Windows' },
    { value: 'doors', label: 'Doors' },
    { value: 'glass', label: 'Glass' },
    { value: 'mirrors', label: 'Mirrors' },
    { value: 'millwork', label: 'Millwork' },
    { value: 'lighting', label: 'Lighting' },
    { value: 'bathroom', label: 'Bathroom' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backdropFilter: 'blur(4px)' }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 ${
            isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <Search className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Import Products
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  AI-powered catalog extraction
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg transition-all ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form - only show when not processing */}
          {status === 'idle' && (
            <div className="space-y-6">
              {/* PDF Upload */}
              <div>
                <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Upload className="w-4 h-4 inline mr-2" />
                  PDF Catalog
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                    pdfFile
                      ? isDark ? 'border-green-500/50 bg-green-500/10' : 'border-green-300 bg-green-50'
                      : isDark ? 'border-white/20 hover:border-white/40' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {pdfFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={isDark ? 'text-white' : 'text-gray-900'}>{pdfFile.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPdfFile(null);
                        }}
                        className={`ml-2 p-1 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        Drop a PDF here or click to browse
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Max 50MB
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Vendor URL */}
              <div>
                <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Link className="w-4 h-4 inline mr-2" />
                  Vendor URL (optional)
                </label>
                <input
                  type="url"
                  value={vendorUrl}
                  onChange={(e) => setVendorUrl(e.target.value)}
                  placeholder="https://vendor.com/product-page"
                  className={`w-full px-4 py-3 rounded-lg border transition-all ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Instructions */}
              <div>
                <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <FileText className="w-4 h-4 inline mr-2" />
                  Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                  placeholder="Example: Add 'The Muse' pendant light (page 45). Import all vanities from pages 60-65."
                  className={`w-full px-4 py-3 rounded-lg border transition-all ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Settings */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-4 h-4" />
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Import Settings
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block mb-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value} className={isDark ? 'bg-gray-800' : ''}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={generateSEO}
                        onChange={(e) => setGenerateSEO(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Generate SEO descriptions
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fetchImages}
                        onChange={(e) => setFetchImages(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Fetch images from web
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={markAsTest}
                        onChange={(e) => setMarkAsTest(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Mark as test products
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    <div>
                      {errors.map((error, i) => (
                        <p key={i} className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleClose}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={startResearch}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Research Products
                </button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {(status === 'starting' || status === 'processing') && (
            <div className="py-8 text-center">
              <Loader2 className={`w-12 h-12 mx-auto mb-4 animate-spin ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`} />
              
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {message || 'Processing...'}
              </h3>
              
              {/* Progress bar */}
              <div className={`w-full h-2 rounded-full overflow-hidden mb-4 ${
                isDark ? 'bg-white/10' : 'bg-gray-200'
              }`}>
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {progress}% complete
                {productsFound > 0 && ` • ${productsFound} products found`}
                {totalCost !== null && ` • Cost: $${totalCost.toFixed(4)}`}
              </p>
              
              {costBreakdown && (
                <div className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <div className="flex justify-center gap-3">
                    {costBreakdown.gemini > 0 && (
                      <span>Gemini: ${costBreakdown.gemini.toFixed(4)}</span>
                    )}
                    {costBreakdown.vision > 0 && (
                      <span>Vision: ${costBreakdown.vision.toFixed(4)}</span>
                    )}
                    {costBreakdown.storage > 0 && (
                      <span>Storage: ${costBreakdown.storage.toFixed(4)}</span>
                    )}
                  </div>
                </div>
              )}
              
              {errors.length > 0 && (
                <div className={`mt-4 p-3 rounded-lg text-left ${
                  isDark ? 'bg-yellow-500/10' : 'bg-yellow-50'
                }`}>
                  <p className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    Warnings: {errors.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Completed State */}
          {status === 'completed' && (
            <div className="py-8 text-center">
              <CheckCircle className={`w-12 h-12 mx-auto mb-4 ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`} />
              
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Research Complete!
              </h3>
              
              <p className={`mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Found {productsFound} product{productsFound !== 1 ? 's' : ''}
              </p>
              
              {totalCost !== null && (
                <p className={`mb-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  Total Cost: <span className="font-bold">${totalCost.toFixed(4)}</span>
                </p>
              )}
              
              <button
                onClick={handleClose}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"
              >
                View Results
              </button>
            </div>
          )}

          {/* Failed State */}
          {status === 'failed' && (
            <div className="py-8 text-center">
              <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${
                isDark ? 'text-red-400' : 'text-red-600'
              }`} />
              
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Research Failed
              </h3>
              
              <p className={`mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {message || 'An error occurred during processing'}
              </p>
              
              {errors.length > 0 && (
                <div className={`mb-6 p-3 rounded-lg text-left ${
                  isDark ? 'bg-red-500/10' : 'bg-red-50'
                }`}>
                  {errors.map((error, i) => (
                    <p key={i} className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                      {error}
                    </p>
                  ))}
                </div>
              )}
              
              <div className="flex justify-center gap-3">
                <button
                  onClick={resetForm}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
