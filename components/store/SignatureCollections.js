import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTheme } from '../Layout';
import { Heart, Loader2, ShoppingCart } from 'lucide-react';
import { getSupabase } from '../../lib/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';
import { ProductService } from '../../lib/productService';
import ProductModal from './ProductModal';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Product images fallback by category (only used if product.image_url is not available)
const getProductImage = (slug, category) => {
  // Fallback to category-based images
  const categoryImages = {
    windows: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
    doors: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
    hardware: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&h=600&fit=crop',
    custom: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop',
    glass: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
    mirrors: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
    millwork: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop',
    lighting: 'https://images.unsplash.com/photo-1549388604-817d15aa0110?w=800&h=600&fit=crop',
  };
  return categoryImages[category] || categoryImages.custom;
};

export default function SignatureCollections({ products = [] }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('windows-doors');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [processing, setProcessing] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const videoRef = useRef(null);
  const isOpeningModal = useRef(false);

  // Map database categories to display categories
  const categoryMap = {
    'windows': 'windows-doors',
    'doors': 'windows-doors',
    'glass': 'glass-mirrors',
    'mirrors': 'glass-mirrors',
    'lighting': 'lighting',
    'pendants': 'lighting',
    'sconces': 'lighting',
    'floor-lamps': 'lighting',
    'table-lamps': 'lighting',
    'recessed': 'lighting',
  };

  const categories = [
    { id: 'windows-doors', label: 'Windows & Doors' },
    { id: 'glass-mirrors', label: 'Glass & Mirrors' },
    { id: 'lighting', label: 'Lighting' },
  ];

  // Filter products based on selected category
  useEffect(() => {
    let filtered = [];
    
    if (selectedCategory === 'windows-doors') {
      // Exclude bundles (Build a House products)
      const excludeBundles = products.filter(product => {
        const productCategory = product.metadata?.category || '';
        const productId = product.metadata?.productId || '';
        // Exclude bundles and Build a House products
        if (productCategory === 'bundles' || productId?.startsWith('BH-')) {
          return false;
        }
        // Exclude millwork products
        if (productId === 'M-101' || productId === 'M-201' || productId === 'M-301') {
          return false;
        }
        if (productCategory === 'millwork') {
          return false;
        }
        // Only include windows and doors
        return productCategory === 'windows' || productCategory === 'doors';
      });
      
      // Separate windows and doors
      // Exclude casement-window (W-006) and single-hung-paneled-glass-window (W-005)
      // Include single-hung-window (W-001)
      const allWindows = excludeBundles.filter(p => {
        if (p.metadata?.category !== 'windows') return false;
        const slug = p.slug || '';
        return slug !== 'casement-window' && slug !== 'single-hung-paneled-glass-window';
      });
      // Prioritize single-hung-window, then add others
      const priorityWindows = allWindows.filter(p => {
        const slug = p.slug || '';
        return slug === 'single-hung-window';
      });
      const otherWindows = allWindows.filter(p => {
        const slug = p.slug || '';
        return slug !== 'single-hung-window';
      }).slice(0, 2); // Get 2 more windows
      const windows = [...priorityWindows, ...otherWindows]; // Show 3 windows total
      
      // Ensure laminated-glass-door (D-002) and flush-oak-door (D-001) are included
      // Exclude 2-panel-door (D-006)
      const allDoors = excludeBundles.filter(p => {
        if (p.metadata?.category !== 'doors') return false;
        const slug = p.slug || '';
        return slug !== '2-panel-door';
      });
      // Prioritize D-001 and D-002, then add others
      const priorityDoors = allDoors.filter(p => {
        const slug = p.slug || '';
        return slug === 'laminated-glass-door' || slug === 'flush-oak-door';
      });
      const otherDoors = allDoors.filter(p => {
        const slug = p.slug || '';
        return slug !== 'laminated-glass-door' && slug !== 'flush-oak-door';
      }).slice(0, 1); // Get 1 more door
      const doors = [...priorityDoors, ...otherDoors]; // Show 3 doors total
      
      // Combine: 3 windows + 3 doors
      filtered = [...windows, ...doors];
    } else if (selectedCategory === 'glass-mirrors') {
      // Filter for glass and mirrors only
      filtered = products.filter(product => {
        const productCategory = product.metadata?.category || '';
        // Exclude bundles
        if (productCategory === 'bundles') {
          return false;
        }
        const mappedCategory = categoryMap[productCategory];
        return mappedCategory === selectedCategory;
      }).slice(0, 6);
    } else if (selectedCategory === 'lighting') {
      // Filter for lighting products
      filtered = products.filter(product => {
        const productCategory = product.metadata?.category || '';
        // Exclude bundles
        if (productCategory === 'bundles') {
          return false;
        }
        const mappedCategory = categoryMap[productCategory];
        return mappedCategory === 'lighting';
      }).slice(0, 6);
    }
    
    setFilteredProducts(filtered);
  }, [selectedCategory, products]);

  // Listen for category filter events from FeaturedCollections
  useEffect(() => {
    const handleFilterCategory = (event) => {
      const category = event.detail;
      if (category) {
        setSelectedCategory(category);
        // No auto-scroll - only "Online Shop" button should trigger scrolling
      }
    };

    window.addEventListener('filterCategory', handleFilterCategory);
    return () => window.removeEventListener('filterCategory', handleFilterCategory);
  }, []);

  // Initialize with filtered products for default category
  useEffect(() => {
    if (products.length > 0 && filteredProducts.length === 0) {
      let filtered = [];
      
      if (selectedCategory === 'windows-doors') {
        // Exclude bundles (Build a House products)
        const excludeBundles = products.filter(product => {
          const productCategory = product.metadata?.category || '';
          const productId = product.metadata?.productId || '';
          // Exclude bundles and Build a House products
          if (productCategory === 'bundles' || productId?.startsWith('BH-')) {
            return false;
          }
          // Exclude millwork products
          if (productId === 'M-101' || productId === 'M-201' || productId === 'M-301') {
            return false;
          }
          if (productCategory === 'millwork') {
            return false;
          }
          // Only include windows and doors
          return productCategory === 'windows' || productCategory === 'doors';
        });
        
        // Separate windows and doors
        // Exclude casement-window (W-006) and single-hung-paneled-glass-window (W-005)
        // Include single-hung-window (W-001)
        const allWindows = excludeBundles.filter(p => {
          if (p.metadata?.category !== 'windows') return false;
          const slug = p.slug || '';
          return slug !== 'casement-window' && slug !== 'single-hung-paneled-glass-window';
        });
        // Prioritize single-hung-window, then add others
        const priorityWindows = allWindows.filter(p => {
          const slug = p.slug || '';
          return slug === 'single-hung-window';
        });
        const otherWindows = allWindows.filter(p => {
          const slug = p.slug || '';
          return slug !== 'single-hung-window';
        }).slice(0, 2); // Get 2 more windows
        const windows = [...priorityWindows, ...otherWindows]; // Show 3 windows total
        
        // Ensure laminated-glass-door (D-002) and flush-oak-door (D-001) are included
        // Exclude 2-panel-door (D-006)
        const allDoors = excludeBundles.filter(p => {
          if (p.metadata?.category !== 'doors') return false;
          const slug = p.slug || '';
          return slug !== '2-panel-door';
        });
        // Prioritize D-001 and D-002, then add others
        const priorityDoors = allDoors.filter(p => {
          const slug = p.slug || '';
          return slug === 'laminated-glass-door' || slug === 'flush-oak-door';
        });
        const otherDoors = allDoors.filter(p => {
          const slug = p.slug || '';
          return slug !== 'laminated-glass-door' && slug !== 'flush-oak-door';
        }).slice(0, 1); // Get 1 more door
        const doors = [...priorityDoors, ...otherDoors]; // Show 3 doors total
        
        // Combine: 3 windows + 3 doors
        filtered = [...windows, ...doors];
      } else if (selectedCategory === 'glass-mirrors') {
        // Filter for glass and mirrors only
        filtered = products.filter(product => {
          const productCategory = product.metadata?.category || '';
          // Exclude bundles
          if (productCategory === 'bundles') {
            return false;
          }
          const mappedCategory = categoryMap[productCategory];
          return mappedCategory === selectedCategory;
        }).slice(0, 6);
      } else if (selectedCategory === 'lighting') {
        // Filter for lighting products
        filtered = products.filter(product => {
          const productCategory = product.metadata?.category || '';
          // Exclude bundles
          if (productCategory === 'bundles') {
            return false;
          }
          const mappedCategory = categoryMap[productCategory];
          return mappedCategory === 'lighting';
        }).slice(0, 6);
      }
      
      setFilteredProducts(filtered);
    }
  }, [products, selectedCategory, filteredProducts.length]);

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleProductClick = (product) => {
    // Prevent multiple rapid clicks
    if (isOpeningModal.current) {
      return;
    }
    
    isOpeningModal.current = true;
    setSelectedProduct(product);
    setIsModalOpen(true);
    
    // Reset flag after a short delay
    setTimeout(() => {
      isOpeningModal.current = false;
    }, 500);
  };

  const handleBuyNow = async (product, selectedVariant, quantity, height = null, width = null) => {
    try {
      setIsModalOpen(false);
      setProcessing(prev => ({ ...prev, [product.id]: true }));
      
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if user is authenticated
      if (!session?.access_token) {
        // Guest checkout - if cart has items, add this product and go to checkout
        // Store product info in sessionStorage for guest checkout
        sessionStorage.setItem('guest_checkout_product', JSON.stringify({
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          productImage: product.image_url,
          variantName: selectedVariant?.name || null,
          variantMaterial: selectedVariant?.material || null,
          price: selectedVariant?.price || product.price,
          quantity: quantity,
          height: height,
          width: width,
        }));
        router.push('/guest-checkout');
        return;
      }

      // Authenticated user flow
      // Send variantName instead of variantPrice - backend will look up price from database
      const doCheckout = async (token) => {
        return fetch(`/api/products/${product.id}/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            quantity: quantity,
            variantName: selectedVariant?.name || null,
            height: height,
            width: width,
          }),
        });
      };

      let response = await doCheckout(session.access_token);

      // Retry once on 401 with refreshed session
      if (response.status === 401) {
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshed?.session?.access_token) {
          response = await doCheckout(refreshed.session.access_token);
        }
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to custom checkout page
      router.push(`/checkout?clientSecret=${data.clientSecret}`);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error initiating purchase:', error);
      }
      alert('Failed to start checkout. Please try again.');
      setIsModalOpen(true);
      setProcessing(prev => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    } finally {
      setProcessing(prev => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    }
  };

  // Determine width and padding based on page context
  const isStorePage = router.pathname === '/custom';
  const isHomePage = router.pathname === '/';
  
  // Match FeaturedCollections width pattern
  const containerWidth = 'max-w-7xl';
  
  // Increased horizontal padding for better spacing
  const containerPadding = isStorePage 
    ? 'px-8 sm:px-12 md:px-16 lg:px-20' // Store page: more padding
    : 'px-6 sm:px-12 md:px-16 lg:px-20'; // Home page: more padding
  
  const topPadding = isStorePage ? 'pt-4 md:pt-6' : 'pt-8 md:pt-12';

  // Intersection Observer for video - only play when in viewport (only if video is shown)
  useEffect(() => {
    if (isHomePage) return; // Don't set up observer on home page since video is moved out
    
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Play video when it enters viewport
            video.play().catch((err) => {
              if (process.env.NODE_ENV !== 'production') {
                console.warn('Video autoplay failed:', err);
              }
            });
          } else {
            // Pause video when it leaves viewport
            video.pause();
          }
        });
      },
      { threshold: 0.5 } // Play when 50% of video is visible
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [isHomePage]);

  return (
    <section 
      id="standard-catalogue" 
      className={`${topPadding} pb-8 md:pb-12 ${containerWidth} mx-auto`}
    >
      <div className={`w-full ${containerPadding}`}>
        {/* Title Section - Only show on home page */}
        {isHomePage && (
          <div className="mb-8 md:mb-12">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-blue-500 mb-4">
              <span>Shop</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className={`text-4xl font-bold leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <span className={isDark ? 'text-gray-300' : 'text-black'}>
                  Order from our standard-catalogue.
                </span>
              </h2>
              <p className={`text-sm transition-colors duration-1000 ${
                isDark ? 'text-white/60' : 'text-gray-600'
              }`}>
                Standard Fabrication Timeline: 2 weeks
              </p>
            </div>
          </div>
        )}
        
        {/* Video Section - Only show on non-home pages */}
        {!isHomePage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full mb-12"
          >
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-12 md:mb-16">
              <video
                ref={videoRef}
                muted
                playsInline
                loop={false}
                className="w-full h-full object-cover"
                style={{ borderRadius: '1.5rem' }}
                onEnded={(e) => {
                  // Video has finished playing once
                  e.target.pause();
                }}
              >
                <source src="https://video.wixstatic.com/video/c6bfe7_aa801596d13f40c19a29efc74cc85138/1080p/mp4/file.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            
            {/* Text Section - Below Video */}
            <div className="text-center">
              <h2 className={`text-3xl md:text-4xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Order from our standard catalogue
              </h2>
              <p className={`text-sm max-w-lg mx-auto mt-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                For homebuilders, general contractors and our DIY community
              </p>
            </div>
          </motion.div>
        )}

        {/* Category Buttons */}
        <div className="flex flex-wrap gap-3 mb-12 justify-center">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2 rounded-full text-xs uppercase tracking-widest transition-all duration-300 ${
                selectedCategory === category.id
                  ? `about-devello-glass ${isDark ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/50' : 'bg-emerald-500/20 text-emerald-700 border-emerald-400/50'} border-2`
                  : `about-devello-glass border ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`
              }`}
            >
              {category.label}
            </button>
          ))}
          <button 
            onClick={() => {
              router.push('/storecatalogue');
            }}
            className={`about-devello-glass uppercase text-xs tracking-widest hover:opacity-70 transition-opacity flex items-center gap-2 px-4 py-2 rounded-full border-2 ${
              isDark 
                ? 'bg-blue-500/30 text-blue-300 border-blue-400/50' 
                : 'bg-blue-500/20 text-blue-700 border-blue-400/50'
            }`}
          >
            View All
            <span>→</span>
          </button>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className={isHomePage
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 lg:gap-8"
            : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8"
          }>
            {filteredProducts.map((product, index) => {
              const category = product.metadata?.category || 'custom';
              // Use image_url from database first, then fallback to getProductImage
              const imageUrl = product.image_url || getProductImage(product.slug, category);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleProductClick(product)}
                  className={`relative overflow-hidden w-full aspect-[4/3] group cursor-pointer ${isDark ? 'bg-transparent' : 'bg-transparent'}`}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                  <button className="absolute top-4 right-4 w-8 h-8 rounded-full about-devello-glass hover:bg-white/90 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
                    <Heart className="w-4 h-4" />
                  </button>

                  <div className="absolute bottom-0 left-4 right-4 pb-4 md:pb-3">
                    <div className="flex items-center justify-between">
                      <div className="relative h-auto flex-1">
                        <h3 className="text-white font-light text-lg mb-1">
                          {product.name}
                        </h3>
                        {(product.metadata?.category === 'glass' || product.metadata?.category === 'mirrors') ? (
                          <p className="text-white/80 text-xs font-light italic">
                            Custom pricing available
                          </p>
                        ) : (
                          <p className="text-white/80 text-xs font-light">
                            {(() => {
                              const category = product.metadata?.category;
                              const variants = product.metadata?.variants || [];
                              const hasVariants = Array.isArray(variants) && variants.length > 0;
                              
                              if (category === 'windows' && hasVariants) {
                                // Get minimum price from variants (bronze price)
                                const prices = variants
                                  .map(v => v.price)
                                  .filter(p => p !== undefined && p !== null);
                                if (prices.length > 0) {
                                  const minPrice = Math.min(...prices);
                                  return `Starting at ${formatPrice(minPrice)}`;
                                }
                              }
                              return formatPrice(product.price);
                            })()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product);
                        }}
                        disabled={processing[product.id]}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-3 py-1.5 rounded-full text-xs flex items-center gap-1 text-white group-hover:bg-blue-500/20 group-hover:backdrop-blur-md group-hover:border group-hover:border-blue-400/30 ${
                          processing[product.id] ? 'cursor-not-allowed' : ''
                        }`}
                      >
                        {processing[product.id] ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3 h-3" />
                            Buy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className={isDark ? 'text-white/60' : 'text-gray-600'}>
              No products found in this category.
            </p>
          </div>
        )}

        {/* Product Modal */}
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setTimeout(() => setSelectedProduct(null), 300);
            }}
            onBuyNow={handleBuyNow}
          />
        )}
      </div>
    </section>
  );
}

