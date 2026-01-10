import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useTheme } from '../../../components/Layout';
import { getSupabase } from '../../../lib/supabaseClient';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Image as ImageIcon,
  Save,
  X,
  Eye,
  EyeOff,
  Package,
  DollarSign,
  Tag,
  FileText,
  Upload,
  AlertCircle,
  Database
} from 'lucide-react';
import ConfirmDeleteModal from '../../../components/admin/ConfirmDeleteModal';
import DatabaseViewerModal from '../../../components/admin/DatabaseViewerModal';
import ImageUploader from '../../../components/admin/ImageUploader';
import ProductImportModal from '../../../components/admin/ProductImportModal';
import ProductImportResults from '../../../components/admin/ProductImportResults';

export default function StoreManagement() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'category', 'price', 'material'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportResults, setShowImportResults] = useState(false);
  const [completedJobId, setCompletedJobId] = useState(null);
  const supabase = getSupabase();

  /**
   * Get a valid session token, refreshing if necessary
   * @returns {Promise<{token: string, error?: string}>}
   */
  const getValidToken = async () => {
    try {
      if (!supabase) {
        return { token: null, error: 'Supabase client not available' };
      }

      // Get current session
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // If we have a session, check if token is about to expire (within 5 minutes)
      if (session?.access_token && session.expires_at) {
        const expiresAt = session.expires_at * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;
        const fiveMinutes = 5 * 60 * 1000;
        
        // Proactively refresh if token expires within 5 minutes
        if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
          console.log('[STORE_MGMT] Token expiring soon, proactively refreshing...');
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('[STORE_MGMT] Proactive refresh failed:', refreshError);
          } else if (refreshedSession?.access_token) {
            session = refreshedSession;
            console.log('[STORE_MGMT] Token refreshed successfully');
          }
        }
      }
      
      // If no session or session error, try to refresh
      if (!session || sessionError) {
        console.log('[STORE_MGMT] No session or session error, attempting refresh...');
        
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession) {
          console.error('[STORE_MGMT] Failed to refresh session:', refreshError);
          return { 
            token: null, 
            error: refreshError?.message || 'Session expired. Please log in again.' 
          };
        }
        
        session = refreshedSession;
      }

      const token = session?.access_token;
      
      if (!token) {
        console.error('[STORE_MGMT] No access token in session');
        return { 
          token: null, 
          error: 'No authentication token available. Please log in again.' 
        };
      }

      return { token, error: null };
    } catch (error) {
      console.error('[STORE_MGMT] Error getting token:', error);
      return { 
        token: null, 
        error: error.message || 'Failed to get authentication token' 
      };
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [statusFilter, typeFilter]); // Only fetch when filters change, client-side filtering handles search/category

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Get authentication token
      const { token, error: tokenError } = await getValidToken();
      if (tokenError || !token) {
        setError(tokenError || 'Authentication required');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('productType', typeFilter);
      params.append('limit', '100');

      const response = await fetch(`/api/admin/products/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        setProducts(data.products || []);
      } else {
        setError(data.error || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct({ ...product });
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setEditingProduct({
      name: '',
      description: '',
      slug: '',
      price: 0,
      currency: 'usd',
      product_type: 'one_time',
      status: 'active',
      is_test: false,
      visible_in_catalog: true,
      image_url: '',
      metadata: null,
      shippingProfile: null,
      table: 'products'
    });
    setShowCreateModal(true);
  };

  const handleDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setError(null);
      setDeleting(true);
      // Get authentication token
      const { token, error: tokenError } = await getValidToken();
      if (tokenError || !token) {
        setError(tokenError || 'Authentication required');
        setDeleting(false);
        setShowDeleteModal(false);
        return;
      }

      const response = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setProductToDelete(null);
        await fetchProducts();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete product');
        setDeleting(false);
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(`Failed to delete product: ${err.message}`);
      setDeleting(false);
    }
  };

  // Batch selection handlers
  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedProducts.length === 0) return;

    try {
      setError(null);
      setBatchDeleting(true);
      // Get authentication token
      const { token, error: tokenError } = await getValidToken();
      if (tokenError || !token) {
        setError(tokenError || 'Authentication required');
        setBatchDeleting(false);
        setShowDeleteModal(false);
        return;
      }

      // Delete products one by one (or create a batch endpoint)
      const deletePromises = selectedProducts.map(productId =>
        fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      );

      const results = await Promise.allSettled(deletePromises);
      const failed = results.filter(r => r.status === 'rejected' || !r.value.ok);
      
      if (failed.length > 0) {
        setError(`Failed to delete ${failed.length} product(s). Please try again.`);
      } else {
        setSelectedProducts([]);
        await fetchProducts();
      }
    } catch (err) {
      console.error('Error batch deleting products:', err);
      setError(`Failed to delete products: ${err.message}`);
    } finally {
      setBatchDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!editingProduct.name || editingProduct.name.trim() === '') {
      setError('Product name is required');
      return;
    }
    if (!editingProduct.slug || editingProduct.slug.trim() === '') {
      setError('Product slug is required');
      return;
    }
    if (!editingProduct.price || isNaN(parseInt(editingProduct.price)) || parseInt(editingProduct.price) < 0) {
      setError('Valid price is required (in cents, e.g., 10000 for $100.00)');
      return;
    }

    try {
      setError(null);
      // Get authentication token
      const { token, error: tokenError } = await getValidToken();
      if (tokenError || !token) {
        setError(tokenError || 'Authentication required');
        return;
      }

      const isCreate = showCreateModal;
      const url = isCreate 
        ? '/api/admin/products/create'
        : `/api/admin/products/${editingProduct.id}`;
      
      const method = isCreate ? 'POST' : 'PATCH';

      // Prepare data
      let parsedMetadata = null;
      if (editingProduct.metadata) {
        if (typeof editingProduct.metadata === 'string') {
          try {
            parsedMetadata = JSON.parse(editingProduct.metadata);
          } catch (parseError) {
            setError('Invalid JSON in metadata field');
            return;
          }
        } else {
          parsedMetadata = editingProduct.metadata;
        }
      }

      const dataToSend = {
        ...editingProduct,
        price: parseInt(editingProduct.price),
        metadata: parsedMetadata,
      };

      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok) {
        setShowEditModal(false);
        setShowCreateModal(false);
        setEditingProduct(null);
        setError(null);
        await fetchProducts();
      } else {
        setError(result.error || 'Failed to save product');
      }
    } catch (err) {
      console.error('Error saving product:', err);
      setError(`Failed to save product: ${err.message}`);
    }
  };

  // Image upload is now handled by ImageUploader component

  // Extract category from metadata
  const getProductCategory = (product) => {
    if (product.metadata && typeof product.metadata === 'object') {
      return product.metadata.category || 'uncategorized';
    }
    return 'uncategorized';
  };

  // Extract material from metadata
  const getProductMaterial = (product) => {
    if (product.metadata && typeof product.metadata === 'object') {
      return product.metadata.material || 'N/A';
    }
    return 'N/A';
  };

  // Get all unique categories from products
  const getAllCategories = () => {
    const categories = new Set();
    products.forEach(product => {
      const category = getProductCategory(product);
      if (category && category !== 'uncategorized') {
        categories.add(category);
      }
    });
    return Array.from(categories).sort();
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = !searchTerm || 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || getProductCategory(product) === categoryFilter;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'category':
          const categoryA = getProductCategory(a);
          const categoryB = getProductCategory(b);
          comparison = categoryA.localeCompare(categoryB);
          break;
        
        case 'price':
          comparison = a.price - b.price;
          break;
        
        case 'material':
          const materialA = getProductMaterial(a);
          const materialB = getProductMaterial(b);
          comparison = materialA.localeCompare(materialB);
          break;
        
        case 'name':
        default:
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatPrice = (price, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100);
  };

  const formatMetadata = (metadata) => {
    if (!metadata) return '{}';
    if (typeof metadata === 'string') {
      try {
        return JSON.stringify(JSON.parse(metadata), null, 2);
      } catch {
        return metadata;
      }
    }
    // Create a copy without variants for the "Other Metadata" editor
    const { variants, ...otherMetadata } = metadata;
    return JSON.stringify(otherMetadata, null, 2);
  };

  return (
    <AdminLayout currentPage="store">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Store Management
            </h1>
            <p className={`text-sm ${isDark ? 'text-white opacity-70' : 'text-gray-600'}`}>
              Manage products, inventory, and catalog
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setShowDatabaseModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  : 'bg-white/60 hover:bg-white/80 text-gray-900 border border-gray-300'
              }`}
            >
              <Database className="w-4 h-4" />
              View Database
            </motion.button>
            <motion.button
              onClick={() => setShowImportModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              Import Products
            </motion.button>
            <motion.button
              onClick={handleCreate}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Product
            </motion.button>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col gap-4">
          {/* Search and Category Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`about-devello-glass w-full pl-10 pr-4 py-2.5 rounded-lg border-2 transition-all ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40 focus:bg-white/15'
                    : 'bg-white/60 border-white/40 text-gray-900 placeholder-gray-500 focus:border-gray-400 focus:bg-white/80'
                }`}
                style={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
              />
            </div>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`about-devello-glass w-full px-4 py-2.5 rounded-lg border-2 transition-all appearance-none cursor-pointer ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white focus:border-white/40 focus:bg-white/15'
                    : 'bg-white/60 border-white/40 text-gray-900 focus:border-gray-400 focus:bg-white/80'
                }`}
                style={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="all" className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>All Categories</option>
                {getAllCategories().map(category => (
                  <option key={category} value={category} className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${
                isDark ? 'text-white/60' : 'text-gray-500'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`about-devello-glass w-full px-4 py-2.5 rounded-lg border-2 transition-all appearance-none cursor-pointer ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white focus:border-white/40 focus:bg-white/15'
                    : 'bg-white/60 border-white/40 text-gray-900 focus:border-gray-400 focus:bg-white/80'
                }`}
                style={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="all" className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>All Status</option>
                <option value="active" className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>Active</option>
                <option value="inactive" className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>Inactive</option>
                <option value="archived" className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>Archived</option>
              </select>
              <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${
                isDark ? 'text-white/60' : 'text-gray-500'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={`about-devello-glass w-full px-4 py-2.5 rounded-lg border-2 transition-all appearance-none cursor-pointer ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white focus:border-white/40 focus:bg-white/15'
                    : 'bg-white/60 border-white/40 text-gray-900 focus:border-gray-400 focus:bg-white/80'
                }`}
                style={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="all" className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>All Types</option>
                <option value="one_time" className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>One Time</option>
                <option value="subscription" className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>Subscription</option>
                <option value="service" className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>Service</option>
              </select>
              <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${
                isDark ? 'text-white/60' : 'text-gray-500'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Sort Controls */}
          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Sort by:
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`about-devello-glass px-4 py-2.5 rounded-lg border-2 transition-all appearance-none cursor-pointer ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white focus:border-white/40 focus:bg-white/15'
                    : 'bg-white/60 border-white/40 text-gray-900 focus:border-gray-400 focus:bg-white/80'
                }`}
                style={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="name" className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>Name</option>
                <option value="category" className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>Category</option>
                <option value="price" className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>Price</option>
                <option value="material" className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>Material</option>
              </select>
              <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${
                isDark ? 'text-white/60' : 'text-gray-500'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
              }`}
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
              <span className="text-sm">{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
            </button>
          </div>
        </div>

        {/* Batch Actions Bar */}
        {selectedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`about-devello-glass rounded-xl p-4 border-2 flex items-center justify-between ${
              isDark ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-300 bg-blue-50'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedProducts([])}
                className={`text-sm underline ${isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Clear selection
              </button>
            </div>
            <motion.button
              onClick={() => {
                setProductToDelete(null); // Clear single delete state
                setShowDeleteModal(true);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </motion.button>
          </motion.div>
        )}

        {/* Products Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border-2 ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}
          >
            <div className="flex items-start gap-3">
              <X className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <div className="flex-1">
                <p className={`font-medium mb-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>Error</p>
                <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
                <button
                  onClick={() => setError(null)}
                  className={`mt-2 text-xs underline ${isDark ? 'text-red-300 hover:text-red-200' : 'text-red-700 hover:text-red-800'}`}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        ) : filteredProducts.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            No products found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <input
                      type="checkbox"
                      checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                      onChange={toggleSelectAll}
                      className={`w-4 h-4 rounded cursor-pointer ${
                        isDark ? 'accent-blue-500' : 'accent-blue-600'
                      }`}
                    />
                  </th>
                  <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Image</th>
                  <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Name</th>
                  <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Category</th>
                  <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Material</th>
                  <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Price</th>
                  <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Type</th>
                  <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Status</th>
                  <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} ${
                      selectedProducts.includes(product.id) ? (isDark ? 'bg-blue-500/10' : 'bg-blue-50') : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className={`w-4 h-4 rounded cursor-pointer ${
                          isDark ? 'accent-blue-500' : 'accent-blue-600'
                        }`}
                      />
                    </td>
                    <td className="py-3 px-4">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded flex items-center justify-center ${
                          isDark ? 'bg-white/5' : 'bg-gray-100'
                        }`}>
                          <ImageIcon className="w-6 h-6 opacity-50" />
                        </div>
                      )}
                    </td>
                    <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <div className="font-medium">{product.name}</div>
                      {product.description && (
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {product.description.substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td className={`py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {getProductCategory(product)}
                      </span>
                    </td>
                    <td className={`py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {getProductMaterial(product)}
                    </td>
                    <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatPrice(product.price, product.currency)}
                    </td>
                    <td className={`py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {product.product_type}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        product.status === 'active'
                          ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800'
                          : product.status === 'inactive'
                          ? isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-800'
                          : isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <motion.button
                          onClick={() => handleEdit(product)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`p-2 rounded transition-all ${
                            isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                          }`}
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(product)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`p-2 rounded transition-all ${
                            isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-600'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit/Create Modal */}
        <AnimatePresence>
          {(showEditModal || showCreateModal) && editingProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backdropFilter: 'blur(4px)' }}
              onClick={() => {
                setShowEditModal(false);
                setShowCreateModal(false);
                setEditingProduct(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 ${
                  isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {showCreateModal ? 'Create Product' : 'Edit Product'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setShowCreateModal(false);
                      setEditingProduct(null);
                    }}
                    className={`p-2 rounded-lg transition-all ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Image Upload */}
                  <ImageUploader
                    value={editingProduct.image_url || ''}
                    onChange={(url) => setEditingProduct({ ...editingProduct, image_url: url })}
                    onUploadComplete={async (url) => {
                      // Auto-save if editing existing product
                      if (editingProduct.id && !showCreateModal) {
                        try {
                          const { token, error: tokenError } = await getValidToken();
                          if (!tokenError && token) {
                            await fetch(`/api/admin/products/${editingProduct.id}`, {
                              method: 'PATCH',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ image_url: url })
                            });
                            // Refresh products list to show updated image
                            await fetchProducts();
                          }
                        } catch (err) {
                          console.error('Auto-save failed:', err);
                          // Don't show error - user can still save manually
                        }
                      }
                    }}
                    isDark={isDark}
                    label="Product Image"
                    maxSizeMB={10}
                    folder="products"
                  />

                  {/* Basic Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Name *
                      </label>
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-white/5 border-white/10 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Slug *
                      </label>
                      <input
                        type="text"
                        value={editingProduct.slug}
                        onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-white/5 border-white/10 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Price (cents) *
                        <span className={`text-xs ml-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                          (e.g., 10000 = $100.00)
                        </span>
                      </label>
                      <input
                        type="number"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-white/5 border-white/10 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="10000"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Currency
                      </label>
                      <input
                        type="text"
                        value={editingProduct.currency}
                        onChange={(e) => setEditingProduct({ ...editingProduct, currency: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-white/5 border-white/10 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Product Type
                      </label>
                      <select
                        value={editingProduct.product_type}
                        onChange={(e) => setEditingProduct({ ...editingProduct, product_type: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-white/5 border-white/10 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="one_time">One Time</option>
                        <option value="subscription">Subscription</option>
                        <option value="service">Service</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Status
                      </label>
                      <select
                        value={editingProduct.status}
                        onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-white/5 border-white/10 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Description
                    </label>
                    <textarea
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      rows={4}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  {/* Additional Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Stripe Price ID
                      </label>
                      <input
                        type="text"
                        value={editingProduct.stripe_price_id || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stripe_price_id: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-white/5 border-white/10 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Shipping Profile
                      </label>
                      <input
                        type="text"
                        value={editingProduct.shippingProfile || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, shippingProfile: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-white/5 border-white/10 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Variants Editor */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className={`block font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Product Variants
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentMetadata = editingProduct.metadata || {};
                          const currentVariants = currentMetadata.variants || [];
                          setEditingProduct({
                            ...editingProduct,
                            metadata: {
                              ...currentMetadata,
                              variants: [
                                ...currentVariants,
                                {
                                  name: '',
                                  price: editingProduct.price || 0,
                                  material: '',
                                  notes: '',
                                  image_url: ''
                                }
                              ]
                            }
                          });
                        }}
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
                    
                    {editingProduct.metadata?.variants?.length > 0 ? (
                      <div className="space-y-4">
                        {editingProduct.metadata.variants.map((variant, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border ${
                              isDark
                                ? 'bg-white/5 border-white/10'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Variant {index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentMetadata = editingProduct.metadata || {};
                                  const newVariants = [...(currentMetadata.variants || [])];
                                  newVariants.splice(index, 1);
                                  setEditingProduct({
                                    ...editingProduct,
                                    metadata: {
                                      ...currentMetadata,
                                      variants: newVariants
                                    }
                                  });
                                }}
                                className={`p-1 rounded transition-all ${
                                  isDark
                                    ? 'hover:bg-red-500/20 text-red-400'
                                    : 'hover:bg-red-50 text-red-600'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className={`block mb-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Variant Name *
                                </label>
                                <input
                                  type="text"
                                  value={variant.name || ''}
                                  onChange={(e) => {
                                    const currentMetadata = editingProduct.metadata || {};
                                    const newVariants = [...(currentMetadata.variants || [])];
                                    newVariants[index] = { ...newVariants[index], name: e.target.value };
                                    setEditingProduct({
                                      ...editingProduct,
                                      metadata: {
                                        ...currentMetadata,
                                        variants: newVariants
                                      }
                                    });
                                  }}
                                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                    isDark
                                      ? 'bg-white/5 border-white/10 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                  placeholder="e.g., Standard Metal Patio"
                                />
                              </div>
                              
                              <div>
                                <label className={`block mb-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Price (cents) *
                                </label>
                                <input
                                  type="number"
                                  value={variant.price || 0}
                                  onChange={(e) => {
                                    const currentMetadata = editingProduct.metadata || {};
                                    const newVariants = [...(currentMetadata.variants || [])];
                                    newVariants[index] = { ...newVariants[index], price: parseInt(e.target.value) || 0 };
                                    setEditingProduct({
                                      ...editingProduct,
                                      metadata: {
                                        ...currentMetadata,
                                        variants: newVariants
                                      }
                                    });
                                  }}
                                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                    isDark
                                      ? 'bg-white/5 border-white/10 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>
                              
                              <div>
                                <label className={`block mb-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Material
                                </label>
                                <input
                                  type="text"
                                  value={variant.material || ''}
                                  onChange={(e) => {
                                    const currentMetadata = editingProduct.metadata || {};
                                    const newVariants = [...(currentMetadata.variants || [])];
                                    newVariants[index] = { ...newVariants[index], material: e.target.value };
                                    setEditingProduct({
                                      ...editingProduct,
                                      metadata: {
                                        ...currentMetadata,
                                        variants: newVariants
                                      }
                                    });
                                  }}
                                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                    isDark
                                      ? 'bg-white/5 border-white/10 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                  placeholder="e.g., Aluminum + glass"
                                />
                              </div>
                              
                              <div>
                                <label className={`block mb-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Notes
                                </label>
                                <input
                                  type="text"
                                  value={variant.notes || ''}
                                  onChange={(e) => {
                                    const currentMetadata = editingProduct.metadata || {};
                                    const newVariants = [...(currentMetadata.variants || [])];
                                    newVariants[index] = { ...newVariants[index], notes: e.target.value };
                                    setEditingProduct({
                                      ...editingProduct,
                                      metadata: {
                                        ...currentMetadata,
                                        variants: newVariants
                                      }
                                    });
                                  }}
                                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                    isDark
                                      ? 'bg-white/5 border-white/10 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                  placeholder="e.g., Dual-pane glass, standard hardware"
                                />
                              </div>
                            </div>
                            
                            {/* Variant Image Upload */}
                            <div className="mt-4">
                              <ImageUploader
                                value={variant.image_url || ''}
                                onChange={(url) => {
                                  const currentMetadata = editingProduct.metadata || {};
                                  const newVariants = [...(currentMetadata.variants || [])];
                                  newVariants[index] = { ...newVariants[index], image_url: url };
                                  setEditingProduct({
                                    ...editingProduct,
                                    metadata: {
                                      ...currentMetadata,
                                      variants: newVariants
                                    }
                                  });
                                }}
                                isDark={isDark}
                                label="Variant Image"
                                maxSizeMB={10}
                                folder="products/variants"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`text-center py-8 rounded-lg border ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-gray-400'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}>
                        <p>No variants added. Click "Add Variant" to create one.</p>
                      </div>
                    )}
                  </div>

                  {/* Metadata (Other fields) */}
                  <div>
                    <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Other Metadata (JSON) - Category, Product ID, etc.
                    </label>
                    <textarea
                      value={formatMetadata({
                        ...(editingProduct.metadata || {}),
                        variants: undefined // Exclude variants from JSON editor
                      })}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string
                        if (value.trim() === '') {
                          const currentVariants = editingProduct.metadata?.variants || [];
                          setEditingProduct({ 
                            ...editingProduct, 
                            metadata: currentVariants.length > 0 ? { variants: currentVariants } : null
                          });
                          return;
                        }
                        try {
                          const parsed = JSON.parse(value);
                          // Preserve variants when updating other metadata
                          const currentVariants = editingProduct.metadata?.variants || [];
                          setEditingProduct({ 
                            ...editingProduct, 
                            metadata: {
                              ...parsed,
                              variants: currentVariants
                            }
                          });
                          // Clear any previous JSON error
                          if (error && error.includes('Invalid JSON')) {
                            setError(null);
                          }
                        } catch (parseError) {
                          // Don't set error on every keystroke, only show if user tries to save
                          // The validation in handleSave will catch this
                        }
                      }}
                      rows={6}
                      className={`w-full px-4 py-2 rounded-lg border font-mono text-sm ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder='{"category": "doors", "productId": "D-007", "highlights": []}'
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.is_test || false}
                        onChange={(e) => setEditingProduct({ ...editingProduct, is_test: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className={isDark ? 'text-white' : 'text-gray-900'}>Test Product</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.visible_in_catalog !== false}
                        onChange={(e) => setEditingProduct({ ...editingProduct, visible_in_catalog: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className={isDark ? 'text-white' : 'text-gray-900'}>Visible in Catalog</span>
                    </label>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-4 pt-4">
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setShowCreateModal(false);
                        setEditingProduct(null);
                      }}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        isDark
                          ? 'bg-white/10 hover:bg-white/20 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                        isDark
                          ? 'bg-white/20 hover:bg-white/30 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      Save Product
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Database Viewer Modal */}
        {showDatabaseModal && (
          <DatabaseViewerModal
            isOpen={showDatabaseModal}
            onClose={() => setShowDatabaseModal(false)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          productToDelete ? (
            <ConfirmDeleteModal
              isOpen={showDeleteModal}
              onClose={() => {
                setShowDeleteModal(false);
                setProductToDelete(null);
                setDeleting(false);
              }}
              onConfirm={confirmDelete}
              title="Delete Product"
              message={`Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone.`}
              loading={deleting}
            />
          ) : selectedProducts.length > 0 ? (
            <ConfirmDeleteModal
              isOpen={showDeleteModal}
              onClose={() => {
                setShowDeleteModal(false);
                setBatchDeleting(false);
              }}
              onConfirm={handleBatchDelete}
              title="Delete Products"
              message={`Are you sure you want to delete ${selectedProducts.length} product${selectedProducts.length !== 1 ? 's' : ''}? This action cannot be undone.`}
              loading={batchDeleting}
            />
          ) : null
        )}

        {/* Product Import Modal */}
        <ProductImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onComplete={(jobId) => {
            setCompletedJobId(jobId);
            setShowImportModal(false);
            setShowImportResults(true);
          }}
        />

        {/* Product Import Results Modal */}
        <ProductImportResults
          isOpen={showImportResults}
          onClose={() => {
            setShowImportResults(false);
            setCompletedJobId(null);
            fetchProducts(); // Refresh product list after import
          }}
          jobId={completedJobId}
          onImportComplete={() => {
            fetchProducts(); // Refresh product list after import
          }}
        />
      </div>
    </AdminLayout>
  );
}
