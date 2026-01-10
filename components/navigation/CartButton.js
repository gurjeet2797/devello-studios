import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';

const CartButton = ({ cartItemCount, isDark, onClick, className = "" }) => {
  if (cartItemCount <= 0) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ y: 0, scale: 0.95 }}
      onClick={onClick}
      className={`about-devello-glass p-1 rounded-full transition-all duration-500 h-10 w-10 flex items-center justify-center relative ${className}`}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      style={{ transformOrigin: "center center" }}
    >
      <ShoppingCart className="w-5 h-5" />
      {cartItemCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold ${
            isDark
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {cartItemCount > 9 ? '9+' : cartItemCount}
        </motion.span>
      )}
    </motion.button>
  );
};

export default CartButton;

