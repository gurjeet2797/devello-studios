import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import { useTheme } from '../../components/Layout';
import { 
  Calendar,
  CheckSquare,
  Contact,
  Image as ImageIcon,
  X
} from 'lucide-react';

export default function LaurasWorkspace() {
  const { isDark } = useTheme();
  const [expandedApp, setExpandedApp] = useState(null);

  const apps = [
    {
      id: 'calendar',
      title: 'Calendar',
      icon: Calendar,
      color: isDark ? 'text-blue-300' : 'text-blue-600'
    },
    {
      id: 'tasklist',
      title: 'Task List',
      icon: CheckSquare,
      color: isDark ? 'text-green-300' : 'text-green-600'
    },
    {
      id: 'contacts',
      title: 'Contacts',
      icon: Contact,
      color: isDark ? 'text-purple-300' : 'text-purple-600'
    },
    {
      id: 'image-generator',
      title: 'Image Generator',
      icon: ImageIcon,
      color: isDark ? 'text-pink-300' : 'text-pink-600'
    }
  ];

  const handleAppClick = (appId) => {
    if (expandedApp === appId) {
      setExpandedApp(null);
    } else {
      setExpandedApp(appId);
    }
  };

  return (
    <AdminLayout currentPage="lauras-workspace">
      <div className="space-y-6">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Laura's Workspace
          </h1>
          <p className={`text-sm ${isDark ? 'text-white opacity-70' : 'text-gray-600'}`}>
            Your personal workspace applications
          </p>
        </div>

        {/* Bento Grid */}
        <AnimatePresence>
          {expandedApp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedApp(null)}
              className="fixed inset-0 z-40 flex items-center justify-center p-4 pt-20"
              style={{
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)'
              }}
            >
              {apps
                .filter(app => app.id === expandedApp)
                .map(app => {
                  const Icon = app.icon;
                  return (
                    <motion.div
                      key={app.id}
                      layoutId={`app-${app.id}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`about-devello-glass rounded-3xl p-8 border-2 w-full max-w-4xl max-h-[80vh] overflow-y-auto ${
                        isDark ? 'border-white/20' : 'border-white/40'
                      }`}
                    >
                      <div className="relative">
                        <motion.button
                          onClick={() => setExpandedApp(null)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`absolute top-0 right-0 p-2 rounded-full ${
                            isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-white/40 hover:bg-white/60'
                          } transition-all`}
                        >
                          <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                        </motion.button>
                        
                        <div className="flex flex-col items-center justify-center min-h-[400px]">
                          <Icon className={`w-20 h-20 mb-6 ${app.color}`} />
                          <h3 className={`text-3xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {app.title}
                          </h3>
                          <p className={`text-base ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                            Placeholder application - Coming soon
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map((app, index) => {
            const Icon = app.icon;
            const isExpanded = expandedApp === app.id;
            
            return (
              <motion.div
                key={app.id}
                layoutId={`app-${app.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.1,
                  layout: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }
                }}
                onClick={() => handleAppClick(app.id)}
                className={`about-devello-glass rounded-2xl p-6 border-2 cursor-pointer transition-all ${
                  isDark ? 'border-white/10 hover:border-white/20' : 'border-white/30 hover:border-white/50'
                } ${isExpanded ? 'pointer-events-none opacity-0' : ''}`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                layout
              >
                <div className="flex flex-col items-center justify-center h-48">
                  <Icon className={`w-12 h-12 mb-4 ${app.color}`} />
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {app.title}
                  </h3>
                  <p className={`text-sm mt-2 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                    Click to expand
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

