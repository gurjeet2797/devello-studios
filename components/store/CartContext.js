import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase } from '../../lib/supabaseClient';

export const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('devello_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error loading cart from localStorage:', error);
        }
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('devello_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Clear cart on auth sign-out
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setCartItems([]);
        localStorage.removeItem('devello_cart');
        sessionStorage.removeItem('devello_cart');
      }
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);

  const addToCart = (product, selectedVariant = null, quantity = 1, height = null, width = null) => {
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(
        item => item.productId === product.id && 
        item.variantName === (selectedVariant?.name || null) &&
        item.height === height &&
        item.width === width
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        const updated = [...prev];
        updated[existingItemIndex].quantity += quantity;
        return updated;
      } else {
        // Add new item
        const price = selectedVariant?.price || product.price;
        return [...prev, {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          productImage: product.image_url,
          variantName: selectedVariant?.name || null,
          variantMaterial: selectedVariant?.material || null,
          price: price,
          quantity: quantity,
          height: height || null,
          width: width || null,
          product: product, // Store full product for checkout
          selectedVariant: selectedVariant
        }];
      }
    });
  };

  const removeFromCart = (productId, variantName = null) => {
    setCartItems(prev => 
      prev.filter(item => 
        !(item.productId === productId && item.variantName === variantName)
      )
    );
  };

  const updateQuantity = (productId, variantName, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantName);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.productId === productId && item.variantName === variantName
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('devello_cart');
    sessionStorage.removeItem('devello_cart');
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

