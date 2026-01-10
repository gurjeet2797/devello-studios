import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Database, Plus, Trash2, Save, Image as ImageIcon, Upload, ChevronDown, ChevronRight, Info, Package, FileCode, HelpCircle2 } from 'lucide-react';
import { useTheme } from '../Layout';
import ImageUploader from './ImageUploader';

export default function DatabaseViewerModal({ isOpen, onClose }) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('images'); // 'images', 'metadata', 'schema'
  const [metadataStructure, setMetadataStructure] = useState({
    variants: [],
    coverImages: [],
    category: '',
    material: '',
    productId: '',
    highlights: []
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset to defaults when modal opens
      setMetadataStructure({
        variants: [],
        coverImages: [],
        category: '',
        material: '',
        productId: '',
        highlights: []
      });
      setError(null);
    }
  }, [isOpen]);

  const addVariant = () => {
    setMetadataStructure(prev => ({
      ...prev,
      variants: [
        ...(prev.variants || []),
        { name: '', price: 0, material: '', notes: '', image_url: '' }
      ]
    }));
  };

  const removeVariant = (indexToRemove) => {
    setMetadataStructure(prev => ({
      ...prev,
      variants: (prev.variants || []).filter((_, index) => index !== indexToRemove)
    }));
  };

  const updateVariantField = (index, field, value) => {
    setMetadataStructure(prev => {
      const newVariants = [...(prev.variants || [])];
      if (newVariants[index]) {
        newVariants[index] = { ...newVariants[index], [field]: value };
      }
      return { ...prev, variants: newVariants };
    });
  };

  const handleCoverImageUpload = (url, slotIndex) => {
    setMetadataStructure(prev => {
      const newImages = [...(prev.coverImages || [])];
      // Ensure array has enough slots
      while (newImages.length <= slotIndex) {
        newImages.push('');
      }
      newImages[slotIndex] = url;
      return { ...prev, coverImages: newImages };
    });
  };

  const removeCoverImage = (indexToRemove) => {
    setMetadataStructure(prev => ({
      ...prev,
      coverImages: (prev.coverImages || []).filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSaveMetadata = async () => {
    setError(null);
    setSaving(true);
    try {
      // In a real application, you would send this metadataStructure to an API
      // to update the 'metadata' JSONB column of a specific product.
      console.log('Saving metadata structure:', metadataStructure);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Metadata structure saved successfully! (Simulated)');
      onClose();
    } catch (err) {
      setError(`Failed to save metadata: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className={`about-devello-glass rounded-2xl border-2 relative z-10 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col ${
              isDark ? 'border-white/10' : 'border-white/30'
            }`}
          >
            {/* Header */}
            <div className={`p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Database className={`w-6 h-6 ${isDark ? 'text-blue-300' : 'text-blue-700'}`} />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Product Database Editor
                    </h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      Manage product images and metadata without code changes
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isDark ? 'text-white/70' : 'text-gray-600'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                {[
                  { id: 'images', label: 'Product Images', icon: ImageIcon },
                  { id: 'metadata', label: 'Product Info', icon: Package },
                  { id: 'schema', label: 'Database Fields', icon: FileCode }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      activeTab === id
                        ? isDark
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-blue-100 text-blue-700 border border-blue-300'
                        : isDark
                        ? 'text-white/60 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl p-4 border-2 mb-4 ${
                    isDark
                      ? 'bg-red-500/10 border-red-500/30 text-red-300'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <p className="font-medium mb-1">Error</p>
                  <p className="text-sm opacity-90">{error}</p>
                </motion.div>
              )}

              {/* Images Tab */}
              {activeTab === 'images' && (
                <div className="space-y-6">
                  {/* Info Banner */}
                  <div className={`rounded-xl p-4 border-2 ${
                    isDark
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-200'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Product Images Guide</p>
                        <p className="text-sm opacity-90">
                          Upload images that will be displayed on your product pages. Cover images appear in a scrollable gallery, and variant images show different product options.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cover Images Section */}
                  <div className={`rounded-xl border-2 p-6 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/40'
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <ImageIcon className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Cover Images (Product Gallery)
                      </h3>
                    </div>
                    <p className={`text-sm mb-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      Add up to 3 images that customers can scroll through on your product page. These showcase your product from different angles.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[0, 1, 2].map((slot) => {
                        const image = metadataStructure.coverImages[slot];
                        return (
                          <div
                            key={slot}
                            className={`rounded-lg border-2 p-4 ${
                              isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/60'
                            }`}
                          >
                            <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Cover Image {slot + 1}
                            </label>
                            {image ? (
                              <div className="space-y-2">
                                <img
                                  src={image}
                                  alt={`Cover ${slot + 1}`}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                                <div className="flex gap-2">
                                  <ImageUploader
                                    value={image}
                                    onChange={(url) => handleCoverImageUpload(url, slot)}
                                    isDark={isDark}
                                    buttonText="Change"
                                    className="flex-1"
                                  />
                                  <button
                                    onClick={() => removeCoverImage(slot)}
                                    className={`p-2 rounded-lg transition-all ${
                                      isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-600'
                                    }`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <ImageUploader
                                value=""
                                onChange={(url) => handleCoverImageUpload(url, slot)}
                                isDark={isDark}
                                buttonText="Upload Image"
                                className="w-full"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Variant Images Section */}
                  <div className={`rounded-xl border-2 p-6 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/40'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Package className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Variant Images
                        </h3>
                      </div>
                      <button
                        onClick={addVariant}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                          isDark
                            ? 'bg-white/10 hover:bg-white/20 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        Add Variant
                      </button>
                    </div>
                    <p className={`text-sm mb-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      Each product variant (like different materials or sizes) can have its own image. Customers will see the variant image when they select that option.
                    </p>
                    {metadataStructure.variants.length === 0 ? (
                      <div className={`text-center py-8 rounded-lg border-2 border-dashed ${
                        isDark ? 'border-white/20 text-white/60' : 'border-gray-300 text-gray-500'
                      }`}>
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No variants yet. Click "Add Variant" to create one.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {metadataStructure.variants.map((variant, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border-2 ${
                              isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Variant {index + 1}
                              </span>
                              <button
                                onClick={() => removeVariant(index)}
                                className={`p-1 rounded transition-all ${
                                  isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-600'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className={`block text-sm mb-1 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                                  Variant Name
                                </label>
                                <input
                                  type="text"
                                  value={variant.name}
                                  onChange={(e) => updateVariantField(index, 'name', e.target.value)}
                                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                  placeholder="e.g., Standard Metal Patio"
                                />
                              </div>
                              <div>
                                <label className={`block text-sm mb-1 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                                  Price (cents)
                                </label>
                                <input
                                  type="number"
                                  value={variant.price}
                                  onChange={(e) => updateVariantField(index, 'price', parseInt(e.target.value) || 0)}
                                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>
                              <div>
                                <label className={`block text-sm mb-1 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                                  Material
                                </label>
                                <input
                                  type="text"
                                  value={variant.material}
                                  onChange={(e) => updateVariantField(index, 'material', e.target.value)}
                                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                  placeholder="e.g., Aluminum + glass"
                                />
                              </div>
                              <div>
                                <label className={`block text-sm mb-1 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                                  Notes
                                </label>
                                <input
                                  type="text"
                                  value={variant.notes}
                                  onChange={(e) => updateVariantField(index, 'notes', e.target.value)}
                                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                  placeholder="e.g., Dual-pane glass, standard hardware"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className={`block text-sm mb-1 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                                  Variant Image
                                </label>
                                {variant.image_url && (
                                  <img
                                    src={variant.image_url}
                                    alt={variant.name || `Variant ${index + 1}`}
                                    className="w-24 h-24 object-cover rounded-lg mb-2"
                                  />
                                )}
                                <ImageUploader
                                  value={variant.image_url || ''}
                                  onChange={(url) => updateVariantField(index, 'image_url', url)}
                                  isDark={isDark}
                                  buttonText={variant.image_url ? 'Change Image' : 'Upload Image'}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata Tab */}
              {activeTab === 'metadata' && (
                <div className="space-y-6">
                  {/* Info Banner */}
                  <div className={`rounded-xl p-4 border-2 ${
                    isDark
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-200'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Product Information</p>
                        <p className="text-sm opacity-90">
                          These fields help organize and categorize your products. They're stored in the metadata field and don't require database changes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-xl border-2 p-6 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/40'
                  }`}>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Category
                          <span className={`ml-2 text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                            (e.g., windows, doors, glass, mirrors)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={metadataStructure.category}
                          onChange={(e) => setMetadataStructure(prev => ({ ...prev, category: e.target.value }))}
                          className={`w-full px-4 py-2 rounded-lg border text-sm ${
                            isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="e.g., doors"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Material
                          <span className={`ml-2 text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                            (e.g., aluminum, wood, glass)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={metadataStructure.material}
                          onChange={(e) => setMetadataStructure(prev => ({ ...prev, material: e.target.value }))}
                          className={`w-full px-4 py-2 rounded-lg border text-sm ${
                            isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="e.g., aluminum"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Product ID (Internal)
                          <span className={`ml-2 text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                            (Your internal product code)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={metadataStructure.productId}
                          onChange={(e) => setMetadataStructure(prev => ({ ...prev, productId: e.target.value }))}
                          className={`w-full px-4 py-2 rounded-lg border text-sm ${
                            isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="e.g., D-001"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Highlights
                          <span className={`ml-2 text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                            (Comma-separated key features)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={metadataStructure.highlights.join(', ')}
                          onChange={(e) => setMetadataStructure(prev => ({ ...prev, highlights: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                          className={`w-full px-4 py-2 rounded-lg border text-sm ${
                            isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="e.g., Energy Efficient, Customizable, Weather Resistant"
                        />
                        <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                          Separate multiple highlights with commas
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* JSON Preview */}
                  <div className={`rounded-xl border-2 p-6 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/40'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <FileCode className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Metadata Preview (JSON)
                      </h3>
                    </div>
                    <p className={`text-sm mb-3 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      This is how your metadata will be stored in the database:
                    </p>
                    <div className={`p-4 rounded-lg font-mono text-xs overflow-x-auto ${
                      isDark ? 'bg-black/30 text-white/80' : 'bg-gray-100 text-gray-800'
                    }`}>
                      <pre>{JSON.stringify(metadataStructure, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Schema Tab */}
              {activeTab === 'schema' && (
                <div className="space-y-6">
                  {/* Info Banner */}
                  <div className={`rounded-xl p-4 border-2 ${
                    isDark
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200'
                      : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  }`}>
                    <div className="flex items-start gap-3">
                      <HelpCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Database Schema Fields</p>
                        <p className="text-sm opacity-90">
                          These are the core database fields. Most changes here require database migrations. For flexible data, use the "Product Info" tab instead.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-xl border-2 p-6 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/40'
                  }`}>
                    <div className="space-y-3">
                      {[
                        { field: 'id', type: 'String', required: true, editable: false, description: 'Unique product identifier (auto-generated)' },
                        { field: 'name', type: 'String', required: true, editable: true, description: 'Product name shown to customers' },
                        { field: 'description', type: 'String', required: false, editable: true, description: 'Detailed product description' },
                        { field: 'slug', type: 'String', required: true, editable: true, description: 'URL-friendly identifier (e.g., "metro-double-hung-window")' },
                        { field: 'price', type: 'Int', required: true, editable: true, description: 'Price in cents (e.g., 63000 = $630.00)' },
                        { field: 'currency', type: 'String', required: true, editable: true, description: 'Currency code (USD, EUR, etc.)' },
                        { field: 'stripe_price_id', type: 'String', required: false, editable: true, description: 'Stripe Price ID for payment processing' },
                        { field: 'product_type', type: 'String', required: true, editable: true, description: 'Type: one_time, subscription, or service' },
                        { field: 'status', type: 'String', required: true, editable: true, description: 'Status: active, inactive, or archived' },
                        { field: 'is_test', type: 'Boolean', required: true, editable: true, description: 'Mark as test product (for testing only)' },
                        { field: 'visible_in_catalog', type: 'Boolean', required: true, editable: true, description: 'Show this product in the public catalog' },
                        { field: 'image_url', type: 'String', required: false, editable: true, description: 'Main product image URL' },
                        { field: 'metadata', type: 'Json', required: false, editable: true, description: 'Flexible JSON field for additional data (see Product Info tab)' },
                        { field: 'shippingProfile', type: 'String', required: false, editable: true, description: 'Shipping profile code for delivery calculations' },
                        { field: 'created_at', type: 'DateTime', required: true, editable: false, description: 'When this product was created' },
                        { field: 'updated_at', type: 'DateTime', required: true, editable: false, description: 'When this product was last updated' }
                      ].map(({ field, type, required, editable, description }) => (
                        <div
                          key={field}
                          className={`p-4 rounded-lg border ${
                            isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {field}
                                </span>
                                {required && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                                  }`}>
                                    Required
                                  </span>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {type}
                                </span>
                                {!editable && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    Read-only
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                                {description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'} flex justify-end gap-3`}>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  isDark
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Close
              </motion.button>
              <motion.button
                onClick={handleSaveMetadata}
                disabled={saving}
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: saving ? 1 : 0.98 }}
                className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
                  isDark
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
