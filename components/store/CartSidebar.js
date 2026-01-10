"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '../Layout';
import { useCart } from './CartContext';
import Image from 'next/image';

export default function CartSidebar({ isOpen, onClose, onCheckout }) {
  const { isDark } = useTheme();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998]"
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.2)',
            }}
          />

          {/* Modal container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="w-full max-w-2xl about-devello-glass rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              style={{
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                backgroundColor: isDark 
                  ? 'rgba(0, 0, 0, 0.75)'
                  : 'rgba(255, 255, 255, 0.9)',
                boxShadow: isDark 
                  ? '0 20px 60px rgba(0, 0, 0, 0.6)'
                  : '0 20px 60px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div className="flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Shopping Cart
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <ShoppingCart className={`w-16 h-16 mb-4 ${isDark ? 'text-white/30' : 'text-gray-400'}`} />
                    <p className={isDark ? 'text-white/60' : 'text-gray-600'}>
                      Your cart is empty
                    </p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={`${item.productId}-${item.variantName || 'default'}`}
                      className={`p-4 rounded-xl ${
                        isDark ? 'bg-white/10' : 'bg-white/50'
                      }`}
                    >
                      <div className="flex gap-4">
                        {item.productImage && (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={item.productImage}
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {item.productName}
                          </h3>
                          {item.variantName && (
                            <p className={`text-sm mb-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                              {item.variantName}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.productId, item.variantName, item.quantity - 1)}
                                className={`w-6 h-6 rounded flex items-center justify-center ${
                                  isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className={`w-8 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.variantName, item.quantity + 1)}
                                className={`w-6 h-6 rounded flex items-center justify-center ${
                                  isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {formatPrice(item.price * item.quantity)}
                              </span>
                              <button
                                onClick={() => removeFromCart(item.productId, item.variantName)}
                                className={`p-1 rounded hover:bg-red-500/20 transition-colors ${
                                  isDark ? 'text-white/70 hover:text-red-400' : 'text-gray-600 hover:text-red-600'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {cartItems.length > 0 && (
                <div className={`p-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-lg ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      Total
                    </span>
                    <span className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatPrice(getCartTotal())}
                    </span>
                  </div>
                  <button
                    onClick={onCheckout}
                    className={`w-full py-3 rounded-full font-medium transition-all ${
                      isDark
                        ? 'bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-400/50'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600'
                    }`}
                  >
                    Proceed to Checkout
                  </button>
                  <button
                    onClick={clearCart}
                    className={`w-full mt-2 py-2 rounded-full text-sm transition-all ${
                      isDark
                        ? 'text-white/60 hover:text-white/80'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Clear Cart
                  </button>
                </div>
              )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

