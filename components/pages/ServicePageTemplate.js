import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../Layout';
import LeadGenerationForm from '../LeadGenerationForm';
import PartnerMessageModal from '../PartnerMessageModal';
import { MessageCircle, Globe, Building2, ArrowRight } from 'lucide-react';

// Custom hook to safely use theme context
function useSafeTheme() {
  const themeContext = useTheme();
  return themeContext ? themeContext.isDark : true;
}

/**
 * ServicePageTemplate - Standardized template for all service pages
 * 
 * @param {Object} props
 * @param {string} props.title - Main page title
 * @param {string} props.subtitle - Optional subtitle/description
 * @param {Array} props.features - Array of feature objects with icon, title, description
 * @param {string} props.serviceType - Service type for API calls (e.g., 'software', 'construction')
 * @param {string} props.colorScheme - Color scheme ('blue', 'orange', 'green', 'purple')
 * @param {React.Component} props.aboveFormComponent - Component to render above the form
 * @param {React.Component} props.belowFormComponent - Component to render below the form
 * @param {React.Component} props.belowVideoComponent - Component to render below the video/aboveFormComponent
 * @param {React.Component} props.abovePartnersComponent - Component to render above the Building Partners section
 * @param {boolean} props.showForm - Whether to show the lead generation form (default: true)
 */
export default function ServicePageTemplate({
  title,
  titleSecondLine = null,
  titleBold = false,
  titleSecondLineBold = false,
  subtitle,
  features = [],
  serviceType,
  colorScheme = 'blue',
  aboveFormComponent,
  belowFormComponent,
  belowTitleComponent,
  abovePartnersComponent,
  belowVideoComponent,
  showForm = true,
  showPartners = false,
  showFeatures = true
}) {
  const isDark = useSafeTheme();
  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [expandedPartnerId, setExpandedPartnerId] = useState(null);

  // Color scheme mapping
  const colorMap = {
    blue: {
      accent: isDark ? 'text-sky-400' : 'text-sky-500',
      accentBg: isDark ? 'bg-sky-400/20' : 'bg-sky-400/20',
      accentBorder: isDark ? 'border-sky-400/30' : 'border-sky-400/30',
      accentHover: isDark ? 'hover:bg-sky-400/30' : 'hover:bg-sky-400/30',
      accentText: isDark ? 'text-sky-300' : 'text-sky-600',
      accentLink: isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-500 hover:text-sky-600',
      label: 'text-sky-500'
    },
    orange: {
      accent: isDark ? 'text-orange-400' : 'text-orange-600',
      accentBg: isDark ? 'bg-orange-500/20' : 'bg-orange-500/20',
      accentBorder: isDark ? 'border-orange-400/30' : 'border-orange-400/30',
      accentHover: isDark ? 'hover:bg-orange-500/30' : 'hover:bg-orange-500/30',
      accentText: isDark ? 'text-orange-300' : 'text-orange-700',
      accentLink: isDark ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700',
      label: 'text-orange-600'
    },
    green: {
      accent: isDark ? 'text-emerald-400' : 'text-emerald-500',
      accentBg: isDark ? 'bg-emerald-400/20' : 'bg-emerald-400/20',
      accentBorder: isDark ? 'border-emerald-400/30' : 'border-emerald-400/30',
      accentHover: isDark ? 'hover:bg-emerald-400/30' : 'hover:bg-emerald-400/30',
      accentText: isDark ? 'text-emerald-300' : 'text-emerald-600',
      accentLink: isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-500 hover:text-emerald-600',
      label: 'text-emerald-500'
    },
    purple: {
      accent: isDark ? 'text-purple-400' : 'text-purple-600',
      accentBg: isDark ? 'bg-purple-500/20' : 'bg-purple-500/20',
      accentBorder: isDark ? 'border-purple-400/30' : 'border-purple-400/30',
      accentHover: isDark ? 'hover:bg-purple-500/30' : 'hover:bg-purple-500/30',
      accentText: isDark ? 'text-purple-300' : 'text-purple-700',
      accentLink: isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700',
      label: 'text-purple-600'
    },
    yellow: {
      accent: isDark ? 'text-amber-400' : 'text-amber-500',
      accentBg: isDark ? 'bg-amber-400/20' : 'bg-amber-400/20',
      accentBorder: isDark ? 'border-amber-400/30' : 'border-amber-400/30',
      accentHover: isDark ? 'hover:bg-amber-400/30' : 'hover:bg-amber-400/30',
      accentText: isDark ? 'text-amber-300' : 'text-amber-600',
      accentLink: isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-500 hover:text-amber-600',
      label: 'text-amber-500'
    }
  };

  const colors = colorMap[colorScheme] || colorMap.blue;

  // Fetch partners
  useEffect(() => {
    const fetchPartners = async () => {
      setLoadingPartners(true);
      try {
        const url = serviceType 
          ? `/api/partners/public?service_type=${serviceType}`
          : '/api/partners/public';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setPartners(data.partners || []);
        }
      } catch (error) {
        console.error('Error fetching partners:', error);
      } finally {
        setLoadingPartners(false);
      }
    };

    fetchPartners();
  }, [serviceType]);

  const handleContactPartner = (partner) => {
    setSelectedPartner(partner);
    setShowMessageModal(true);
  };

  const handleMessageSent = () => {
    setShowMessageModal(false);
    setSelectedPartner(null);
  };

  return (
    <div className={`min-h-screen w-full ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col items-center justify-start w-full h-full"
      >
        {/* Hero Section - Match StoreHero exactly */}
        <section className={`relative pt-20 pb-16 sm:pt-16 md:pt-24 md:pb-24 w-full ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'}`}>
          <div className="max-w-5xl lg:max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:gap-8 items-center">
              {/* Title and Button Container */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center gap-4 order-1 pt-4 sm:pt-6 md:pt-8"
              >
                <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light leading-tight text-center transition-colors duration-1000 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  <span className={titleBold ? 'font-semibold' : 'font-light'}>{title}</span>
                  {titleSecondLine && (
                    <>
                      <br />
                      <span className={titleSecondLineBold ? 'font-semibold' : 'font-light'}>{titleSecondLine}</span>
                    </>
                  )}
                </h1>
                
                {/* Button below title - Match StoreHero exactly */}
                {belowTitleComponent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="w-full sm:w-auto flex justify-center pt-4 pb-4 min-w-[220px] sm:min-w-[300px] md:min-w-[340px]"
                  >
                    {belowTitleComponent}
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Video/Content Section - Match StoreHero exactly */}
        {aboveFormComponent && (
          <section className={`relative w-full -mt-8 sm:-mt-12 md:-mt-16 ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'}`}>
            <div className="max-w-5xl lg:max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-6 lg:gap-8 items-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative w-full order-2 flex items-center justify-center pb-8 sm:pb-0"
                >
                  {aboveFormComponent}
                </motion.div>
              </div>
            </div>
          </section>
        )}

        {/* Below Video Component */}
        {belowVideoComponent && (
          <div className="w-full">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              {belowVideoComponent}
            </motion.div>
          </div>
        )}

        {/* Lead Generation Form Section */}
        {showForm && (
          <div 
            data-stepper-form
            className={`w-full max-w-2xl sm:max-w-4xl lg:max-w-7xl mx-auto px-6 sm:px-4 md:px-6 lg:px-8 pb-8 ${serviceType === 'software' ? 'pt-0 sm:pt-1' : 'pt-4 sm:pt-8'}`}
          >
            <LeadGenerationForm 
              isDark={isDark} 
              skipStep0={true}
              serviceType={serviceType}
            />
          </div>
        )}

        {/* Below Form Component */}
        {belowFormComponent && (
          <div className="w-full max-w-2xl sm:max-w-4xl lg:max-w-7xl mx-auto px-0 pt-4 sm:pt-8 pb-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {belowFormComponent}
            </motion.div>
          </div>
        )}

        {/* Above Partners Component */}
        {abovePartnersComponent && (
          <div className="w-full">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {abovePartnersComponent}
            </motion.div>
          </div>
        )}

        {/* Building Partners Section */}
        {showPartners && (
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-2xl sm:max-w-4xl lg:max-w-7xl mx-auto px-6 sm:px-4 md:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-20 pb-16"
        >
          <div className="flex flex-col gap-6 lg:gap-8">
            {/* Header Section */}
            <div className="space-y-4">
              <div className={`flex items-center gap-2 text-xs sm:text-sm font-medium ${colors.label}`}>
                <span>Building Partners</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              
              <h2 className={`text-3xl sm:text-4xl font-bold leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <span className={isDark ? 'text-gray-300' : 'text-black'}>Connect with Partners.</span>
              </h2>
              
              <p className={`text-sm sm:text-base leading-relaxed ${
                isDark ? 'text-white/70' : 'text-gray-600'
              }`}>
                Connect with our approved {serviceType || 'service'} partners
              </p>
            </div>

            {loadingPartners ? (
              <div className="text-center py-12">
                <p className={isDark ? 'text-white/70' : 'text-gray-600'}>Loading partners...</p>
              </div>
            ) : partners.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partners.map((partner, index) => {
                  const isExpanded = expandedPartnerId === partner.id;
                  return (
                    <motion.div
                      key={partner.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="about-devello-glass rounded-2xl border hover:shadow-lg transition-all duration-300 overflow-hidden"
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
                      {/* Clickable Header */}
                      <button
                        onClick={() => setExpandedPartnerId(isExpanded ? null : partner.id)}
                        className="w-full p-4 sm:p-6 text-left flex items-start justify-between hover:opacity-80 transition-opacity"
                      >
                        <div className="flex-1">
                          <h3 className={`text-lg sm:text-xl font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {partner.companyName}
                          </h3>
                          {partner.experienceYears && (
                            <p className={`text-xs sm:text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                              {partner.experienceYears} years experience
                            </p>
                          )}
                        </div>
                        <Building2 className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.accent} flex-shrink-0 ml-2`} />
                      </button>
                      
                      {/* Collapsible Content */}
                      <motion.div
                        initial={false}
                        animate={{
                          height: isExpanded ? 'auto' : 0,
                          opacity: isExpanded ? 1 : 0
                        }}
                        transition={{
                          height: { duration: 0.3, ease: 'easeInOut' },
                          opacity: { duration: 0.2 }
                        }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
                          {partner.description && (
                            <p className={`text-xs sm:text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                              {partner.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {partner.portfolioUrl && (
                              <a
                                href={partner.portfolioUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                                  isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                }`}
                              >
                                <Globe className="w-3 h-3" />
                                Portfolio
                              </a>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactPartner(partner);
                            }}
                            className={`w-full px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                              colors.accentBg
                            } ${colors.accentText} ${colors.accentBorder} ${colors.accentHover}`}
                          >
                            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            Send Message
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className={isDark ? 'text-white/70' : 'text-gray-600'}>
                  No {serviceType || 'service'} partners available at the moment. Check back soon!
                </p>
              </div>
            )}
          </div>
        </motion.section>
        )}

        {/* Features Section */}
        {showFeatures && features.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="w-full max-w-2xl sm:max-w-4xl lg:max-w-7xl mx-auto px-6 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-8 pb-16"
          >
            <div className="flex flex-col gap-6 lg:gap-8">
              {/* Header Section */}
              <div className="space-y-4">
                <div className={`flex items-center gap-2 text-xs sm:text-sm font-medium ${colors.label}`}>
                  <span>What We Offer</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                
                <h2 className={`text-3xl sm:text-4xl font-bold leading-tight ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  <span className={isDark ? 'text-gray-300' : 'text-black'}>Our Services.</span>
                </h2>
                
                <p className={`text-sm sm:text-base leading-relaxed ${
                  isDark ? 'text-white/70' : 'text-gray-600'
                }`}>
                  Comprehensive {serviceType || 'service'} solutions tailored to your needs
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="about-devello-glass p-6 rounded-2xl border"
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
                      <IconComponent className={`w-12 h-12 mb-4 ${colors.accent}`} />
                      <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {feature.title}
                      </h3>
                      <p className={`${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        {feature.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>
        )}
      </motion.div>

      {/* Message Modal */}
      {showMessageModal && selectedPartner && (
        <PartnerMessageModal
          partner={selectedPartner}
          isDark={isDark}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedPartner(null);
          }}
          onMessageSent={handleMessageSent}
        />
      )}
    </div>
  );
}

