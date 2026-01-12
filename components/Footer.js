import React from 'react';
import { useTheme } from './Layout';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Footer({ variant = 'full', loading = false }) {
  const { isDark } = useTheme();
  const router = useRouter();
  
  // Check if we're on an admin page
  const isAdminPage = router.pathname.startsWith('/admin');

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
            {/* Standard Disclaimer */}
            <div>
              <h3 className={`font-semibold mb-2 text-sm ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>
                Disclaimer
              </h3>
              <p className="text-xs leading-relaxed">
                Devello Inc provides software development services, AI-powered tools, and digital solutions. Service deliverables and outcomes are subject to the specifications and terms outlined in individual service agreements. We strive to meet agreed-upon specifications but cannot guarantee results beyond what is explicitly stated in service contracts.
              </p>
            </div>
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
