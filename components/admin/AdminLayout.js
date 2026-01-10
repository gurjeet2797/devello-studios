import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../Layout';
import { isAdminEmail } from '../../lib/adminAuth';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Upload, 
  Bell, 
  Search,
  Menu,
  X,
  Moon,
  Sun,
  ShoppingBag,
  Package
} from 'lucide-react';

export default function AdminLayout({ children, currentPage = 'dashboard' }) {
  const { user, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!loading && (!user || !isAdminEmail(user.email))) {
      // Only navigate if not already on home page
      if (router.pathname !== '/') {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  // Track screen size for sidebar toggle
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);


  if (loading || !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center relative ${
        isDark ? 'bg-black' : 'bg-[var(--light-bg)]'
      }`}>
        <div className="loading"></div>
      </div>
    );
  }

  if (!isAdminEmail(user.email)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-black' : 'bg-[var(--light-bg)]'
      }`}>
        <div className="text-center">
          <h1 className={`text-2xl font-bold mb-4 transition-colors duration-700 ${
            isDark ? 'text-white' : 'text-amber-900'
          }`}>Access Denied</h1>
          <p className={`transition-colors duration-700 ${
            isDark ? 'text-gray-400' : 'text-amber-700'
          }`}>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: 'Order Management', href: '/admin/orders', icon: Package, current: currentPage === 'orders' },
    { name: 'Store Management', href: '/admin/store', icon: ShoppingBag, current: currentPage === 'store' },
    { name: 'Partners', href: '/admin/partners', icon: Users, current: currentPage === 'partners' },
  ];

  return (
    <div className={`min-h-screen flex admin-portal ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'}`}>
      {/* Glass Sidebar */}
      <GlassSidebar
        isDark={isDark}
        currentPage={currentPage}
        navigation={navigation}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        desktopSidebarVisible={desktopSidebarVisible}
        setDesktopSidebarVisible={setDesktopSidebarVisible}
        isLargeScreen={isLargeScreen}
        router={router}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Admin Top Bar - Only visible on mobile */}
        <div className="lg:hidden sticky top-16 z-20"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor: 'transparent'
        }}>
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <motion.button
              onClick={() => setSidebarOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="about-devello-glass p-2 rounded-full transition-all duration-300"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative hidden sm:block">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-700 ${
                  isDark ? 'text-gray-400' : 'text-amber-600'
                }`} />
                <input
                  type="text"
                  placeholder="Search..."
                  className={`pl-8 pr-3 py-1.5 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                    isDark
                      ? 'bg-white/10 text-white border border-white/20 placeholder-gray-400'
                      : 'bg-amber-100/50 text-amber-900 border border-amber-300/30 placeholder-amber-600'
                  }`}
                  style={{ backdropFilter: 'blur(10px)' }}
                />
              </div>
              <motion.button 
                onClick={toggleTheme}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="about-devello-glass p-2 rounded-full transition-all duration-300"
              >
                {isDark ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="about-devello-glass p-2 rounded-full transition-all duration-300"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className={`p-4 sm:p-6 pt-20 sm:pt-24 lg:pt-24 mx-auto w-full ${
            currentPage === 'orders' || currentPage === 'store' ? 'max-w-7xl' : 'max-w-2xl sm:max-w-4xl'
          }`}>
            {/* Desktop Menu Button */}
            {isLargeScreen && (
              <div className="hidden lg:flex justify-end mb-6 pt-4">
                <motion.button
                  onClick={() => setDesktopSidebarVisible(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="about-devello-glass px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 hover:scale-105 whitespace-nowrap"
                >
                  <Menu className="w-5 h-5 flex-shrink-0" />
                  <span>Menu</span>
                </motion.button>
              </div>
            )}
            <div 
              className="about-devello-glass no-hover rounded-3xl p-4 sm:p-6 lg:p-8 border"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Glass Sidebar Component
function GlassSidebar({ isDark, currentPage, navigation, sidebarOpen, setSidebarOpen, desktopSidebarVisible, setDesktopSidebarVisible, isLargeScreen, router }) {
  return (
    <>
      {/* Mobile Menu */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-40 overflow-y-auto"
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              backgroundColor: 'transparent'
            }}
            onClick={() => setSidebarOpen(false)}
          >
            {/* Menu Content */}
            <motion.div 
              className="pt-20 px-4 pb-4 space-y-3 flex flex-col items-end"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <motion.button
                onClick={() => setSidebarOpen(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="about-devello-glass px-4 py-3 rounded-full text-base font-medium transition-all duration-300 flex items-center gap-2 text-red-500 hover:text-red-600"
              >
                <X className="w-5 h-5" />
                <span>Close</span>
              </motion.button>

              {/* Navigation Items */}
              {navigation.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      delay: 0.1 + (index * 0.05),
                      duration: 0.3,
                      ease: "easeOut"
                    }}
                  >
                    <motion.a
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className={`about-devello-glass w-auto text-left px-4 py-3 rounded-full text-base font-medium transition-all duration-300 flex items-center gap-3 ${
                        item.current
                          ? isDark ? 'bg-white/20' : 'bg-amber-200/60'
                          : ''
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="whitespace-nowrap">{item.name}</span>
                    </motion.a>
                  </motion.div>
                );
              })}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <AnimatePresence>
        {desktopSidebarVisible && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDesktopSidebarVisible(false)}
              className="hidden lg:block fixed inset-0 z-20"
            />
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="hidden lg:block fixed top-24 z-30"
              style={{ right: 'calc((100% - 68rem) / 2 + 8.5rem)' }}
            >
              <div className="flex flex-col items-end space-y-2">
                {/* Close Button */}
                <motion.button
                  onClick={() => setDesktopSidebarVisible(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="about-devello-glass px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 justify-end whitespace-nowrap text-red-500 hover:text-red-600"
                >
                  <X className="w-5 h-5 flex-shrink-0" />
                  <span>Close</span>
                </motion.button>

                {/* Navigation Items */}
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.a
                      key={item.name}
                      href={item.href}
                      onClick={() => setDesktopSidebarVisible(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className={`about-devello-glass w-auto text-right px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 justify-end ${
                        item.current
                          ? isDark ? 'bg-white/20' : 'bg-amber-200/60'
                          : ''
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="whitespace-nowrap">{item.name}</span>
                    </motion.a>
                  );
                })}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
