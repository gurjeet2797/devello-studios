import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '../Layout';
import { sessionManager } from '../../lib/sessionManager';
import { Package, MapPin, CreditCard, ExternalLink, Plus, Trash2, Edit2, Check, X, Loader2, Star } from 'lucide-react';

/**
 * Main Profile Content - Shows store orders, addresses, and store-related transactions
 */
export default function MainProfileContent({ userData }) {
  const { isDark } = useTheme();
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Address management state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    title: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'US',
    is_primary: false,
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch user's orders and addresses
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = await sessionManager.getAuthHeaders();
        if (!headers.Authorization) return;

        // Fetch orders
        const ordersResponse = await fetch('/api/user/orders', { headers });
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData.orders || []);
        }

        // Fetch addresses
        await fetchAddresses();
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchAddresses = async () => {
    try {
      const headers = await sessionManager.getAuthHeaders();
      const addressesResponse = await fetch('/api/users/addresses', { headers });
      if (addressesResponse.ok) {
        const addressesData = await addressesResponse.json();
        setAddresses(addressesData.addresses || []);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const formatCurrency = (amount, currency = 'usd') => {
    if (typeof amount !== 'number') return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getOrderStatusColor = (status) => {
    const statusColors = {
      pending: isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800',
      processing: isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800',
      shipped: isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-800',
      delivered: isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800',
      completed: isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800',
      cancelled: isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800',
    };
    return statusColors[status] || (isDark ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-800');
  };

  // Address form validation
  const validateAddressForm = () => {
    const errors = {};
    if (!addressForm.address_line1?.trim()) errors.address_line1 = 'Address is required';
    if (!addressForm.city?.trim()) errors.city = 'City is required';
    if (!addressForm.state?.trim()) errors.state = 'State is required';
    if (!addressForm.zip_code?.trim() || !/^\d{5}(-\d{4})?$/.test(addressForm.zip_code)) {
      errors.zip_code = 'Valid ZIP code is required';
    }
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset form
  const resetAddressForm = () => {
    setAddressForm({
      title: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'US',
      is_primary: false,
    });
    setAddressErrors({});
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  // Start editing an address
  const handleEditAddress = (address) => {
    setAddressForm({
      title: address.title || '',
      address_line1: address.address_line1 || '',
      address_line2: address.address_line2 || '',
      city: address.city || '',
      state: address.state || '',
      zip_code: address.zip_code || '',
      country: address.country || 'US',
      is_primary: address.is_primary || false,
    });
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  // Save address (create or update)
  const handleSaveAddress = async () => {
    if (!validateAddressForm()) return;

    setSavingAddress(true);
    try {
      const headers = await sessionManager.getAuthHeaders();
      
      const url = editingAddress 
        ? `/api/users/addresses/${editingAddress.id}`
        : '/api/users/addresses';
      
      const method = editingAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressForm),
      });

      if (response.ok) {
        await fetchAddresses();
        resetAddressForm();
      } else {
        const data = await response.json();
        setAddressErrors({ submit: data.error || 'Failed to save address' });
      }
    } catch (error) {
      console.error('Error saving address:', error);
      setAddressErrors({ submit: 'Failed to save address' });
    } finally {
      setSavingAddress(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    setDeletingId(addressId);
    try {
      const headers = await sessionManager.getAuthHeaders();
      const response = await fetch(`/api/users/addresses/${addressId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        await fetchAddresses();
      }
    } catch (error) {
      console.error('Error deleting address:', error);
    } finally {
      setDeletingId(null);
    }
  };

  // Set address as primary
  const handleSetPrimary = async (addressId) => {
    try {
      const headers = await sessionManager.getAuthHeaders();
      const response = await fetch(`/api/users/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_primary: true }),
      });

      if (response.ok) {
        await fetchAddresses();
      }
    } catch (error) {
      console.error('Error setting primary address:', error);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Orders Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="about-devello-glass rounded-2xl p-4 sm:p-6 border"
        style={{
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          backgroundColor: isDark 
            ? 'rgba(255, 255, 255, 0.15)' 
            : 'rgba(255, 255, 255, 0.7)',
          borderColor: isDark 
            ? 'rgba(255, 255, 255, 0.25)' 
            : 'rgba(0, 0, 0, 0.1)',
          borderWidth: '1px'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package size={20} className={isDark ? 'text-white/70' : 'text-gray-600'} />
            <h3 className={`text-lg sm:text-xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Order History
            </h3>
          </div>
          <Link href="/order-tracking">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className={`text-sm flex items-center gap-1 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
            >
              Track Orders <ExternalLink size={14} />
            </motion.button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex items-center justify-between p-4 rounded-2xl backdrop-blur-sm ${
                  isDark ? 'bg-white/10 border border-white/10' : 'bg-white/80 border border-gray-200/50'
                }`}
                style={{
                  backdropFilter: 'blur(4px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(4px) saturate(150%)',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Order #{order.order_number || order.id?.slice(-8)}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                    {formatDate(order.created_at)} • {formatCurrency(order.amount, order.currency)}
                  </p>
                </div>
                <Link href={`/order-tracking?order=${order.order_number || order.id}`}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className={`ml-4 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isDark 
                        ? 'bg-white/10 hover:bg-white/20 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    View
                  </motion.button>
                </Link>
              </motion.div>
            ))}
            
            {orders.length > 5 && (
              <Link href="/client-portal">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-2 text-sm text-center ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  View all {orders.length} orders →
                </motion.button>
              </Link>
            )}
          </div>
        ) : (
          <div
            className={`rounded-2xl border backdrop-blur-sm p-6 text-center ${
              isDark
                ? 'border-white/20 bg-white/10 text-white/70'
                : 'border-gray-200/60 bg-white/70 text-gray-600'
            }`}
          >
            <Package size={40} className="mx-auto mb-3 opacity-50" />
            <p className="mb-3">No orders yet</p>
            <Link href="/storecatalogue">
              <motion.button
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  isDark 
                    ? 'bg-white/15 hover:bg-white/20 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Browse Store
              </motion.button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* Saved Addresses with Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="about-devello-glass rounded-2xl p-4 sm:p-6 border"
        style={{
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          backgroundColor: isDark 
            ? 'rgba(255, 255, 255, 0.15)' 
            : 'rgba(255, 255, 255, 0.7)',
          borderColor: isDark 
            ? 'rgba(255, 255, 255, 0.25)' 
            : 'rgba(0, 0, 0, 0.1)',
          borderWidth: '1px'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin size={20} className={isDark ? 'text-white/70' : 'text-gray-600'} />
            <h3 className={`text-lg sm:text-xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Shipping Addresses
            </h3>
          </div>
          {!showAddressForm && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddressForm(true)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isDark 
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/50' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              <Plus size={16} />
              Add Address
            </motion.button>
          )}
        </div>

        {/* Address Form */}
        <AnimatePresence>
          {showAddressForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-4 p-4 rounded-xl ${
                isDark ? 'bg-white/10 border border-white/20' : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editingAddress ? 'Edit Address' : 'New Address'}
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Label (optional)
                  </label>
                  <input
                    type="text"
                    value={addressForm.title}
                    onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                    placeholder="e.g., Home, Office"
                    className={`w-full px-3 py-2 rounded-xl text-sm border ${
                      isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={addressForm.address_line1}
                    onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                    placeholder="123 Main St"
                    className={`w-full px-3 py-2 rounded-xl text-sm border ${
                      addressErrors.address_line1 ? 'border-red-500' :
                      isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  {addressErrors.address_line1 && <p className="text-red-500 text-xs mt-1">{addressErrors.address_line1}</p>}
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Apt, Suite (optional)
                  </label>
                  <input
                    type="text"
                    value={addressForm.address_line2}
                    onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                    placeholder="Apt 4B"
                    className={`w-full px-3 py-2 rounded-xl text-sm border ${
                      isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      City *
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl text-sm border ${
                        addressErrors.city ? 'border-red-500' :
                        isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      State *
                    </label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl text-sm border ${
                        addressErrors.state ? 'border-red-500' :
                        isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={addressForm.zip_code}
                    onChange={(e) => setAddressForm({ ...addressForm, zip_code: e.target.value })}
                    placeholder="12345"
                    className={`w-full px-3 py-2 rounded-xl text-sm border ${
                      addressErrors.zip_code ? 'border-red-500' :
                      isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  {addressErrors.zip_code && <p className="text-red-500 text-xs mt-1">{addressErrors.zip_code}</p>}
                </div>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={addressForm.is_primary}
                    onChange={(e) => setAddressForm({ ...addressForm, is_primary: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Set as primary shipping address
                  </span>
                </label>
                
                {addressErrors.submit && (
                  <p className="text-red-500 text-sm">{addressErrors.submit}</p>
                )}
                
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={resetAddressForm}
                    className={`flex-1 py-2 rounded-full text-sm font-medium ${
                      isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAddress}
                    disabled={savingAddress}
                    className={`flex-1 py-2 rounded-full text-sm font-medium flex items-center justify-center gap-2 ${
                      isDark
                        ? 'bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-300'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    } ${savingAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {savingAddress ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Save Address
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : addresses.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`p-4 rounded-2xl backdrop-blur-sm relative group ${
                  isDark ? 'bg-white/10 border border-white/10' : 'bg-white/80 border border-gray-200/50'
                } ${address.is_primary ? (isDark ? 'ring-1 ring-emerald-400/50' : 'ring-1 ring-emerald-500/30') : ''}`}
                style={{
                  backdropFilter: 'blur(4px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(4px) saturate(150%)',
                }}
              >
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!address.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(address.id)}
                      title="Set as primary"
                      className={`p-1.5 rounded-full ${
                        isDark ? 'bg-white/10 hover:bg-white/20 text-white/70' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleEditAddress(address)}
                    title="Edit"
                    className={`p-1.5 rounded-full ${
                      isDark ? 'bg-white/10 hover:bg-white/20 text-white/70' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    disabled={deletingId === address.id}
                    title="Delete"
                    className={`p-1.5 rounded-full ${
                      isDark ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300' : 'bg-red-100 hover:bg-red-200 text-red-600'
                    }`}
                  >
                    {deletingId === address.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {address.title || 'Address'}
                  </span>
                  {address.is_primary && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      Primary
                    </span>
                  )}
                </div>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {address.address_line1}
                  {address.address_line2 && <>, {address.address_line2}</>}
                </p>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {address.city}, {address.state} {address.zip_code}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`rounded-2xl border backdrop-blur-sm p-6 text-center ${
              isDark
                ? 'border-white/20 bg-white/10 text-white/70'
                : 'border-gray-200/60 bg-white/70 text-gray-600'
            }`}
          >
            <MapPin size={40} className="mx-auto mb-3 opacity-50" />
            <p>No saved addresses</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              Add an address for faster checkout
            </p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddressForm(true)}
              className={`mt-3 px-4 py-2 rounded-full text-sm font-medium ${
                isDark 
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              Add Address
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Quick Links for Store */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="about-devello-glass rounded-2xl p-6 border"
        style={{
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          backgroundColor: isDark 
            ? 'rgba(255, 255, 255, 0.15)' 
            : 'rgba(255, 255, 255, 0.7)',
          borderColor: isDark 
            ? 'rgba(255, 255, 255, 0.25)' 
            : 'rgba(0, 0, 0, 0.1)',
          borderWidth: '1px'
        }}
      >
        <h3 className={`text-xl font-light mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Quick Access
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/storecatalogue">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl text-center cursor-pointer transition-all ${
                isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-white/80 hover:bg-white'
              }`}
            >
              <span className="text-2xl mb-2 block">🏪</span>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Store
              </span>
            </motion.div>
          </Link>
          <Link href="/custom">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl text-center cursor-pointer transition-all ${
                isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-white/80 hover:bg-white'
              }`}
            >
              <span className="text-2xl mb-2 block">🛠️</span>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Custom Orders
              </span>
            </motion.div>
          </Link>
          <Link href="/client-portal">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl text-center cursor-pointer transition-all ${
                isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-white/80 hover:bg-white'
              }`}
            >
              <span className="text-2xl mb-2 block">📋</span>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Client Portal
              </span>
            </motion.div>
          </Link>
          <Link href="/contact">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl text-center cursor-pointer transition-all ${
                isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-white/80 hover:bg-white'
              }`}
            >
              <span className="text-2xl mb-2 block">💬</span>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Support
              </span>
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* Email Notifications Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="about-devello-glass rounded-2xl p-4 sm:p-6 border"
        style={{
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          backgroundColor: isDark 
            ? 'rgba(255, 255, 255, 0.15)' 
            : 'rgba(255, 255, 255, 0.7)',
          borderColor: isDark 
            ? 'rgba(255, 255, 255, 0.25)' 
            : 'rgba(0, 0, 0, 0.1)',
          borderWidth: '1px'
        }}
      >
        <h3 className={`text-lg font-light mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Notification Preferences
        </h3>
        <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          Manage order updates and email notifications in your{' '}
          <Link href="/client-portal" className="text-blue-500 hover:underline">
            Client Portal Dashboard
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
