/**
 * Product Import Results
 * 
 * Display and manage extracted products from a research job:
 * - Preview products
 * - Select/deselect for import
 * - Edit product fields
 * - Confirm import
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../Layout';
import { getSupabase } from '../../lib/supabaseClient';
import {
  X,
  Check,
  Edit,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  Save
} from 'lucide-react';

export default function ProductImportResults({ isOpen, onClose, jobId, onImportComplete }) {
  const { isDark } = useTheme();
  const supabase = getSupabase();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [errors, setErrors] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [totalCost, setTotalCost] = useState(null);
  const [costBreakdown, setCostBreakdown] = useState(null);

  /**
   * Get auth token
   */
  const getToken = async () => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  /**
   * Fetch results
   */
  useEffect(() => {
    if (isOpen && jobId) {
      fetchResults();
    }
  }, [isOpen, jobId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setErrors(['Authentication required']);
        return;
      }

      const response = await fetch(`/api/admin/product-research/results/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch results');
      }

      setProducts(data.products || []);
      setErrors(data.errors || []);
      setSuggestions(data.suggestions || []);
      setTotalCost(data.totalCost);
      setCostBreakdown(data.costBreakdown);
      
      // Auto-select high confidence products
      const autoSelected = new Set(
        data.products
          .filter(p => p._selected || p.confidence >= 0.8)
          .map(p => p._tempId)
      );
      setSelectedIds(autoSelected);

    } catch (error) {
      console.error('Fetch results error:', error);
      setErrors([error.message]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle product selection
   */
  const toggleSelection = (tempId) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(tempId)) {
      newSelected.delete(tempId);
    } else {
      newSelected.add(tempId);
    }
    setSelectedIds(newSelected);
  };

  /**
   * Select all/none
   */
  const selectAll = () => {
    setSelectedIds(new Set(products.map(p => p._tempId)));
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  /**
   * Update product field
   */
  const updateProduct = (tempId, field, value) => {
    setProducts(products.map(p => 
      p._tempId === tempId ? { ...p, [field]: value } : p
    ));
  };

  /**
   * Confirm import
   */
  const confirmImport = async () => {
    const selectedProducts = products.filter(p => selectedIds.has(p._tempId));
    
    if (selectedProducts.length === 0) {
      setErrors(['Please select at least one product to import']);
      return;
    }

    setImporting(true);
    setErrors([]);

    try {
      const token = await getToken();
      if (!token) {
        setErrors(['Authentication required']);
        return;
      }

      const response = await fetch('/api/admin/product-research/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId,
          products: selectedProducts
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setImportResult(data);
      
      if (data.failed?.length > 0) {
        setErrors(data.failed.map(f => `${f.name}: ${f.errors.join(', ')}`));
      }

      onImportComplete?.(data);

    } catch (error) {
      console.error('Import error:', error);
      setErrors([error.message]);
    } finally {
      setImporting(false);
    }
  };

  /**
   * Format price for display
   */
  const formatPrice = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format((cents || 0) / 100);
  };

  /**
   * Get confidence color
   */
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return isDark ? 'text-green-400' : 'text-green-600';
    if (confidence >= 0.7) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl flex flex-col ${
            isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'
          }`}
        >
          {/* Header */}
          <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Import Results
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {products.length} products found • {selectedIds.size} selected
                </p>
                {totalCost !== null && (
                  <div className={`mt-2 p-2 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      Total Cost: <span className="font-bold">${totalCost.toFixed(4)}</span>
                    </p>
                    {costBreakdown && (
                      <div className={`mt-1 text-xs ${isDark ? 'text-blue-300' : 'text-blue-500'}`}>
                        {costBreakdown.gemini > 0 && `Gemini: $${costBreakdown.gemini.toFixed(4)}`}
                        {costBreakdown.gemini > 0 && costBreakdown.vision > 0 && ' • '}
                        {costBreakdown.vision > 0 && `Vision: $${costBreakdown.vision.toFixed(4)}`}
                        {(costBreakdown.gemini > 0 || costBreakdown.vision > 0) && costBreakdown.storage > 0 && ' • '}
                        {costBreakdown.storage > 0 && `Storage: $${costBreakdown.storage.toFixed(4)}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-all ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Selection controls */}
            {products.length > 0 && !importResult && (
              <div className="flex items-center gap-4 mt-3">
                <button
                  onClick={selectAll}
                  className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  Select All
                </button>
                <button
                  onClick={selectNone}
                  className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            ) : importResult ? (
              /* Import Result */
              <div className="py-8 text-center">
                <CheckCircle className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Import Complete!
                </h3>
                <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Successfully imported {importResult.importedCount} product{importResult.importedCount !== 1 ? 's' : ''}
                </p>
                
                {importResult.failed?.length > 0 && (
                  <div className={`mb-4 p-4 rounded-lg text-left ${
                    isDark ? 'bg-red-500/10' : 'bg-red-50'
                  }`}>
                    <p className={`font-medium mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      {importResult.failedCount} product{importResult.failedCount !== 1 ? 's' : ''} failed:
                    </p>
                    {importResult.failed.map((f, i) => (
                      <p key={i} className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                        {f.name}: {f.errors.join(', ')}
                      </p>
                    ))}
                  </div>
                )}
                
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"
                >
                  Done
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center">
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  No products found
                </p>
              </div>
            ) : (
              /* Product List */
              <div className="space-y-3">
                {/* Warnings/Suggestions */}
                {(errors.length > 0 || suggestions.length > 0) && (
                  <div className={`p-4 rounded-lg mb-4 ${
                    isDark ? 'bg-yellow-500/10' : 'bg-yellow-50'
                  }`}>
                    {errors.length > 0 && (
                      <div className="mb-2">
                        <p className={`font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                          Warnings:
                        </p>
                        {errors.map((err, i) => (
                          <p key={i} className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>
                            • {err}
                          </p>
                        ))}
                      </div>
                    )}
                    {suggestions.length > 0 && (
                      <div>
                        <p className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                          Suggestions:
                        </p>
                        {suggestions.map((sug, i) => (
                          <p key={i} className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                            • {sug}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {products.map((product) => (
                  <div
                    key={product._tempId}
                    className={`rounded-lg border transition-all ${
                      selectedIds.has(product._tempId)
                        ? isDark ? 'border-blue-500/50 bg-blue-500/10' : 'border-blue-300 bg-blue-50'
                        : isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Product Header */}
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelection(product._tempId)}
                          className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                            selectedIds.has(product._tempId)
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : isDark ? 'border-white/30' : 'border-gray-300'
                          }`}
                        >
                          {selectedIds.has(product._tempId) && <Check className="w-4 h-4" />}
                        </button>
                        
                        {/* Image */}
                        <div className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden ${
                          isDark ? 'bg-white/10' : 'bg-gray-100'
                        }`}>
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className={`w-6 h-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                            </div>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {product.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-sm px-2 py-0.5 rounded ${
                                  isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {product.category}
                                </span>
                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {formatPrice(product.price_cents)}
                                </span>
                                {product.variants?.length > 0 && (
                                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    • {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Confidence & Actions */}
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${getConfidenceColor(product.confidence)}`}>
                                {Math.round((product.confidence || 0) * 100)}%
                              </span>
                              {product._hasIssues && (
                                <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                              )}
                              <button
                                onClick={() => setExpandedId(expandedId === product._tempId ? null : product._tempId)}
                                className={`p-1 rounded ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                              >
                                {expandedId === product._tempId ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          {/* Sources */}
                          {product.sources?.length > 0 && (
                            <div className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              Sources: {product.sources.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedId === product._tempId && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                            <div className="grid grid-cols-2 gap-4">
                              {/* Name */}
                              <div>
                                <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={product.name || ''}
                                  onChange={(e) => updateProduct(product._tempId, 'name', e.target.value)}
                                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                    isDark
                                      ? 'bg-white/5 border-white/10 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>
                              
                              {/* Price */}
                              <div>
                                <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Price (cents)
                                </label>
                                <input
                                  type="number"
                                  value={product.price_cents || 0}
                                  onChange={(e) => updateProduct(product._tempId, 'price_cents', parseInt(e.target.value) || 0)}
                                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                    isDark
                                      ? 'bg-white/5 border-white/10 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>
                              
                              {/* Category */}
                              <div>
                                <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Category
                                </label>
                                <select
                                  value={product.category || 'uncategorized'}
                                  onChange={(e) => updateProduct(product._tempId, 'category', e.target.value)}
                                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                    isDark
                                      ? 'bg-white/5 border-white/10 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                >
                                  <option value="windows">Windows</option>
                                  <option value="doors">Doors</option>
                                  <option value="glass">Glass</option>
                                  <option value="mirrors">Mirrors</option>
                                  <option value="millwork">Millwork</option>
                                  <option value="lighting">Lighting</option>
                                  <option value="bathroom">Bathroom</option>
                                  <option value="uncategorized">Uncategorized</option>
                                </select>
                              </div>
                              
                              {/* Images count */}
                              <div>
                                <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Images
                                </label>
                                <div className={`px-3 py-2 rounded-lg text-sm ${
                                  isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-50 text-gray-600'
                                }`}>
                                  {product.images?.length || 0} image{(product.images?.length || 0) !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                            
                            {/* Description */}
                            <div className="mt-4">
                              <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Description
                              </label>
                              <textarea
                                value={product.description || ''}
                                onChange={(e) => updateProduct(product._tempId, 'description', e.target.value)}
                                rows={3}
                                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                  isDark
                                    ? 'bg-white/5 border-white/10 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </div>
                            
                            {/* Highlights */}
                            {product.highlights?.length > 0 && (
                              <div className="mt-4">
                                <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Highlights
                                </label>
                                <ul className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {product.highlights.map((h, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                      <Check className="w-3 h-3 text-green-500" />
                                      {h}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && !importResult && products.length > 0 && (
            <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedIds.size} of {products.length} products selected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      isDark
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmImport}
                    disabled={importing || selectedIds.size === 0}
                    className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      selectedIds.size === 0
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Import {selectedIds.size} Product{selectedIds.size !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
