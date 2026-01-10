import React from 'react';
import { useTheme } from './Layout';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Footer({ variant = 'full', loading = false }) {
  const { isDark } = useTheme();
  const router = useRouter();
  
  // Check if we're on an admin page
  const isAdminPage = router.pathname.startsWith('/admin');
  
  // Check if we're on the construction page
  const isConstructionPage = router.pathname === '/construction';

  // Hide footer during loading
  if (loading) {
    return null;
  }

  // Simplified footer for tool pages
  if (variant === 'simple') {
    return (
      <footer 
        className={`transition-all duration-700 footer-mobile-blur ${
          isDark ? 'bg-black/20 md:bg-transparent' : 'bg-white/20 md:bg-transparent'
        }`}
      >
        <div className="max-w-2xl sm:max-w-4xl lg:max-w-7xl mx-auto px-6 sm:px-4 md:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className={`text-xs ${
              isDark ? 'text-white/40' : 'text-gray-400'
            }`}>
              AI-generated content for creative purposes only
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer 
      className={`transition-all duration-700 footer-mobile-blur ${
        isDark ? 'bg-black/20 md:bg-transparent' : 'bg-white/20 md:bg-transparent'
      }`}
    >
      <div className="max-w-2xl sm:max-w-4xl lg:max-w-7xl mx-auto px-6 sm:px-4 md:px-6 lg:px-8 pt-8 pb-4">
        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <button
            onClick={scrollToTop}
            className={`text-sm transition-colors hover:opacity-80 ${
              isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Home
          </button>
          <a 
            href="https://devellostudios.com" 
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm transition-colors hover:opacity-80 ${
              isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Apps
          </a>
          <Link 
            href="/construction" 
            className={`text-sm transition-colors hover:opacity-80 ${
              isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Construction
          </Link>
          <Link 
            href="/storecatalogue" 
            className={`text-sm transition-colors hover:opacity-80 ${
              isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Store
          </Link>
          <Link 
            href="/about" 
            className={`text-sm transition-colors hover:opacity-80 ${
              isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            About Devello
          </Link>
        </div>

        {/* Disclaimer and Policy Section */}
        {!isAdminPage && (
          <div className={`mb-8 space-y-6 ${
            isDark ? 'text-white/70' : 'text-gray-600'
          }`}>
            {isConstructionPage ? (
              <>
                {/* Statement of Integrity - Construction Page Only */}
                <div>
                  <h3 className={`font-semibold mb-2 text-sm ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>
                    Statement of Integrity
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Devello Construction was the primary renovation firm for all featured projects. All images are professionally photographed. Devello Construction built and renovated the spaces shown. Furniture, furnishings, and decorative items were provided by clients and are not included in our construction services.
                  </p>
                </div>
                {/* Disclaimer - Construction Page */}
                <div>
                  <h3 className={`font-semibold mb-2 text-sm ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>
                    Disclaimer
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Devello Inc operates as a separate entity from Devello Construction. All construction business, services, and projects are handled exclusively by Devello Construction. Product images, specifications, measurements, and availability are for reference and may vary. Customers are responsible for verifying dimensions, compatibility, and local code requirements. Devello Construction is not responsible for errors arising from incorrect measurements or installation.
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Standard Disclaimer - Other Pages */}
                <div>
                  <h3 className={`font-semibold mb-2 text-sm ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>
                    Disclaimer
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Product images, specifications, measurements, and availability are for reference and may vary. Customers are responsible for verifying dimensions, compatibility, and local code requirements. Devello is not responsible for errors arising from incorrect measurements or installation.
                  </p>
                </div>
                <div>
                  <h3 className={`font-semibold mb-2 text-sm flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>
                    Shipping Policy
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      isDark 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      Coming Soon
                    </span>
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Shipping costs vary by destination, product type, and delivery requirements. Estimates are non-binding; final freight charges are confirmed after order review. All shipments are insured. Customers must inspect deliveries upon arrival and report damage within 48 hours.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Bottom Section */}
        <div className={`pt-4 border-t ${
          isDark ? 'border-white/10' : 'border-amber-300/20'
        }`}>
          <div className="flex flex-col items-center space-y-2">
            <p className={`text-xs ${
              isDark ? 'text-white/50' : 'text-gray-500'
            }`}>
              © 2019 Devello Inc. All rights reserved.
            </p>
            <p className={`text-xs mb-2 ${
              isDark ? 'text-white/60' : 'text-gray-600'
            }`}>
              For inquiries, call <a href="tel:929-266-2966" className="underline hover:opacity-80">929-266-2966</a>
            </p>
            <div className="flex items-center space-x-6 flex-wrap justify-center gap-4">
              <Link 
                href="/contact" 
                className={`text-xs transition-colors hover:opacity-80 ${
                  isDark ? 'text-white/50 hover:text-white/70' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Contact Support
              </Link>
              <Link 
                href="/privacy" 
                className={`text-xs transition-colors hover:opacity-80 ${
                  isDark ? 'text-white/50 hover:text-white/70' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                className={`text-xs transition-colors hover:opacity-80 ${
                  isDark ? 'text-white/50 hover:text-white/70' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
