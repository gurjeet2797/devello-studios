import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { Home, Code, MousePointerClick, Laptop, Settings, Hammer, Wrench, Hand, Briefcase, Package } from 'lucide-react';
import Stepper, { Step } from './Stepper';
import { useAuth } from './auth/AuthProvider';

// Step 0: Service Type Selection
function ServiceSelectionStep({ isDark, onServiceSelect }) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8 py-4"
    >
      <div className="space-y-4 max-w-4xl mx-auto">
        <motion.h2 
          className={`text-2xl sm:text-3xl md:text-4xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
          style={{
            color: isDark ? '#ffffff' : '#111827'
          }}
          animate={{ 
            opacity: isVisible ? 1 : 0,
            y: isVisible ? 0 : -20
          }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
        >
          Your next project starts here.
        </motion.h2>
        <p className={`text-sm sm:text-base leading-relaxed transition-colors duration-300 ${
          isDark ? 'text-white/70' : 'text-gray-600'
        }`}>
          We aim to offer multi-industry solutions — choose how you want to build.
        </p>
      </div>

      {/* Service Selection Tiles */}
      <div className="max-w-sm sm:max-w-4xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
        <div className="flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(280px,480px)_minmax(280px,360px)_minmax(280px,400px)] gap-4 sm:gap-6 justify-center items-center md:items-stretch">
          {/* Build Your Software Tile */}
          <motion.button
            onClick={() => onServiceSelect('software')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group w-full max-w-[300px] sm:max-w-[320px] md:w-full md:max-w-full lg:max-w-[480px] h-full p-4 sm:p-4 md:px-6 rounded-xl sm:rounded-2xl transition-all duration-300 backdrop-blur-sm border flex items-center justify-center gap-2 sm:gap-3 ${
              isDark
                ? 'bg-blue-500/20 text-blue-300 border-blue-400/30 hover:bg-blue-500/30 shadow-lg'
                : 'bg-blue-500/20 text-blue-700 border-blue-400/30 hover:bg-blue-500/30 shadow-lg'
            }`}
          >
            <div className="flex-shrink-0 relative w-6 h-6 sm:w-6 sm:h-6 flex items-center justify-center px-2">
              {/* Main icons - always visible on mobile, hover swap on desktop */}
              <div className="absolute opacity-100 md:group-hover:opacity-0 transition-opacity duration-200">
                <Laptop className="w-6 h-6 sm:w-6 sm:h-6 relative" />
                <Settings className="w-3 h-3 sm:w-3 sm:h-3 absolute -bottom-0.5 -right-0.5" />
              </div>
              {/* Hover icon - only visible on desktop hover */}
              <MousePointerClick className="w-6 h-6 sm:w-6 sm:h-6 absolute opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 hidden md:block" />
            </div>
            <div className="flex-1 text-center max-w-[180px] sm:max-w-[220px] md:max-w-none">
              <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-2">
                <h3 className="text-base sm:text-base md:text-sm lg:text-base font-semibold whitespace-nowrap">Build Your Software</h3>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm md:text-xs lg:text-sm leading-tight md:whitespace-nowrap">Software development services</span>
                <Hand className="w-4 h-4 md:hidden" />
              </div>
            </div>
          </motion.button>

          {/* Build Your Space Tile - Removed for software development focus */}
          {/* Construction services are handled separately on develloconstruction.com */}

          {/* Build Your Company Tile */}
          <motion.button
            onClick={() => {
              router.push('/consulting');
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group w-full max-w-[300px] sm:max-w-[320px] md:w-full md:max-w-full lg:max-w-[400px] h-full p-4 sm:p-4 md:px-6 rounded-xl sm:rounded-2xl transition-all duration-300 backdrop-blur-sm border flex items-center justify-center gap-2 sm:gap-3 ${
              isDark
                ? 'bg-yellow-400/20 text-yellow-200 border-yellow-300/30 hover:bg-yellow-400/30 shadow-lg'
                : 'bg-yellow-400/20 text-yellow-600 border-yellow-300/30 hover:bg-yellow-400/30 shadow-lg'
            }`}
          >
            <div className="flex-shrink-0 relative w-6 h-6 sm:w-6 sm:h-6 flex items-center justify-center px-2">
              {/* Main icons - always visible on mobile, hover swap on desktop */}
              <div className="absolute opacity-100 md:group-hover:opacity-0 transition-opacity duration-200">
                <Briefcase className="w-6 h-6 sm:w-6 sm:h-6 relative" />
              </div>
              {/* Hover icon - only visible on desktop hover */}
              <MousePointerClick className="w-6 h-6 sm:w-6 sm:h-6 absolute opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 hidden md:block" />
            </div>
            <div className="flex-1 text-center max-w-[180px] sm:max-w-[220px] md:max-w-[280px]">
              <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-2">
                <h3 className="text-base sm:text-base md:text-sm lg:text-base font-semibold whitespace-nowrap">Build Your Company</h3>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm md:text-xs lg:text-sm leading-tight md:whitespace-nowrap">Consulting services</span>
                <Hand className="w-4 h-4 md:hidden" />
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Step 1: Why Build Selection
function WelcomeStep({ isDark, user, userData, onInterestsAlign, onInterestsChange, serviceType }) {
  const router = useRouter();
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [showAlignment, setShowAlignment] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [currentGreeting, setCurrentGreeting] = useState('Why do you want to build?');

  // Build reasons data - only business-focused options (not shown for software)
  const buildReasons = [
    { id: 'business_opportunity', label: 'Business Opportunity', color: 'green' },
    { id: 'growth', label: 'Growth', color: 'green' },
    { id: 'solve_problem', label: 'Solve a problem', color: 'green' }
  ];

  const getPersonalizedGreeting = () => {
    if (user && userData?.profile?.first_name) {
      const hour = new Date().getHours();
      const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
      const firstName = userData.profile.first_name;
      return `${timeGreeting}, ${firstName}!`;
    }
    return 'Why do you want to build?';
  };

  // Handle greeting updates with fade animation
  React.useEffect(() => {
    let newGreeting;
    
    // For software, always use personalized greeting, don't change based on selection
    if (serviceType === 'software') {
      newGreeting = getPersonalizedGreeting();
    } else if (selectedReasons.length > 0) {
      newGreeting = 'Our interests align, how can I help?';
    } else {
      newGreeting = getPersonalizedGreeting();
    }
    
    if (newGreeting !== currentGreeting) {
      // Fade out current greeting
      setIsVisible(false);
      
      // After fade out completes, update greeting and fade in
      setTimeout(() => {
        setCurrentGreeting(newGreeting);
        setIsVisible(true);
      }, 300); // Match the transition duration
    }
  }, [user, userData, selectedReasons, serviceType]);

  // Handle parent callbacks separately to avoid render-time updates
  // Enable button when any single option is selected, or always for software
  React.useEffect(() => {
    // For software development, always enable the button
    const interestsAlign = serviceType === 'software' ? true : selectedReasons.length > 0;
    
    onInterestsAlign?.(interestsAlign);
    onInterestsChange?.(selectedReasons, interestsAlign, false);
    
    // Show alignment message if any option is selected
    if (interestsAlign) {
      setTimeout(() => setShowAlignment(true), 500);
    } else {
      setShowAlignment(false);
    }
  }, [selectedReasons, onInterestsAlign, onInterestsChange, serviceType]);

  // Handle reason selection
  const handleReasonToggle = (reasonId) => {
    setSelectedReasons(prev => {
      const newSelection = prev.includes(reasonId) 
        ? prev.filter(id => id !== reasonId)
        : [...prev, reasonId];
      
      return newSelection;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8 py-4"
    >
      <div className="space-y-4">
        {/* Always reserve space for both elements to prevent layout shift */}
        <div className="relative h-16 flex items-center justify-center">
          {/* Button version - shown when greeting includes 'Let's strategize' */}
          <motion.button
            onClick={() => router.push('/consulting')}
            className={`absolute inset-0 text-2xl sm:text-3xl md:text-4xl font-bold transition-colors duration-300 cursor-pointer hover:scale-105 ${
              isDark ? 'text-white hover:text-amber-500' : 'text-gray-900 hover:text-amber-600'
            } ${currentGreeting.includes('Let\'s strategize') ? 'block' : 'hidden'}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: currentGreeting.includes('Let\'s strategize') && isVisible ? 1 : 0,
              y: currentGreeting.includes('Let\'s strategize') && isVisible ? 0 : -20
            }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {currentGreeting}
            <svg className="inline-block ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.button>

          {/* H2 version - shown when greeting doesn't include 'Let's strategize' */}
          <motion.h2 
            className={`absolute inset-0 text-2xl sm:text-3xl md:text-4xl font-bold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            } ${!currentGreeting.includes('Let\'s strategize') ? 'block' : 'hidden'}`}
            style={{
              color: '#111827'
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: !currentGreeting.includes('Let\'s strategize') && isVisible ? 1 : 0,
              y: !currentGreeting.includes('Let\'s strategize') && isVisible ? 0 : -20
            }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
          >
            {currentGreeting}
          </motion.h2>
        </div>
        <p className={`text-base sm:text-lg leading-relaxed transition-colors duration-300 ${
          isDark ? 'text-white/70' : 'text-gray-600'
        }`}>
          Submit a request to open a custom software solution for you next idea
        </p>
      </div>

      {/* Build Reasons Selection - Hidden for software development */}
      {serviceType !== 'software' && (
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {buildReasons.map((reason) => (
              <motion.button
                key={reason.id}
                onClick={() => handleReasonToggle(reason.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                        className={`px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 backdrop-blur-sm border whitespace-nowrap ${
                          selectedReasons.includes(reason.id)
                            ? isDark
                              ? 'bg-green-500/20 text-green-300 border-green-400/30 shadow-lg'
                              : 'bg-green-500/20 text-green-700 border-green-400/30 shadow-lg'
                            : isDark
                              ? 'bg-gray-800/30 text-gray-300 border-gray-600/30 hover:bg-gray-700/40'
                              : 'bg-gray-100/50 text-gray-700 border-gray-300/50 hover:bg-gray-200/60'
                        }`}
              >
                {reason.label}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Step 2: Project Type Selection for Construction
function ConstructionProjectTypeStep({ isDark, formData, setFormData, errors, setErrors }) {
  const handleProjectTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, projectType: type }));
    if (errors.projectType) {
      setErrors(prev => ({ ...prev, projectType: null }));
    }
  };

  const constructionTypes = [
    { value: 'residential', label: 'Residential', description: 'Homes, apartments, or residential buildings' },
    { value: 'commercial', label: 'Commercial', description: 'Office buildings, retail spaces, or commercial properties' },
    { value: 'renovation', label: 'Renovation', description: 'Remodeling or upgrading existing structures' },
    { value: 'new_build', label: 'New Build', description: 'Building from the ground up' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8 py-8"
    >
      <div className="space-y-4">
        <h2 className={`text-3xl sm:text-4xl font-bold transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          What type of construction project?
        </h2>
        <p className={`text-lg transition-colors duration-300 ${
          isDark ? 'text-white/70' : 'text-gray-600'
        }`}>
          Choose the option that best describes your project
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
        {constructionTypes.map((type) => (
          <motion.button
            key={type.value}
            onClick={() => handleProjectTypeSelect(type.value)}
            className={`p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 text-center group ${
              formData.projectType === type.value
                ? isDark
                  ? 'border-orange-500 bg-orange-500/20'
                  : 'border-orange-500 bg-orange-50'
                : isDark
                ? 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700'
                : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="space-y-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto ${
                formData.projectType === type.value
                  ? 'bg-orange-500 text-white'
                  : isDark
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <Hammer className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {type.label}
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-white/70' : 'text-gray-600'
              }`}>
                {type.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
      
      {errors.projectType && (
        <div className="text-center">
          <p className="text-red-500 text-sm">{errors.projectType}</p>
        </div>
      )}
    </motion.div>
  );
}

// Step 2: Project Type Selection for Manufacturing
function ManufacturingProjectTypeStep({ isDark, formData, setFormData, errors, setErrors }) {
  const handleProjectTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, projectType: type }));
    if (errors.projectType) {
      setErrors(prev => ({ ...prev, projectType: null }));
    }
  };

  const manufacturingTypes = [
    { value: 'custom_parts', label: 'Custom Parts', description: 'One-off or small batch custom components' },
    { value: 'assembly', label: 'Assembly', description: 'Product assembly and manufacturing' },
    { value: 'prototyping', label: 'Prototyping', description: 'Product prototypes and testing' },
    { value: 'mass_production', label: 'Mass Production', description: 'Large-scale production runs' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8 py-8"
    >
      <div className="space-y-4">
        <h2 className={`text-3xl sm:text-4xl font-bold transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          What type of manufacturing project?
        </h2>
        <p className={`text-lg transition-colors duration-300 ${
          isDark ? 'text-white/70' : 'text-gray-600'
        }`}>
          Choose the option that best describes your project
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
        {manufacturingTypes.map((type) => (
          <motion.button
            key={type.value}
            onClick={() => handleProjectTypeSelect(type.value)}
            className={`p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 text-center group ${
              formData.projectType === type.value
                ? isDark
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-green-500 bg-green-50'
                : isDark
                ? 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700'
                : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="space-y-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto ${
                formData.projectType === type.value
                  ? 'bg-green-500 text-white'
                  : isDark
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <Package className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {type.label}
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-white/70' : 'text-gray-600'
              }`}>
                {type.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
      
      {errors.projectType && (
        <div className="text-center">
          <p className="text-red-500 text-sm">{errors.projectType}</p>
        </div>
      )}
    </motion.div>
  );
}

// Step 2: Project Type Selection (Software - default)
function ProjectTypeStep({ isDark, formData, setFormData, errors, setErrors }) {
  const handleProjectTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, projectType: type }));
    // Clear project type errors when user selects
    if (errors.projectType) {
      setErrors(prev => ({ ...prev, projectType: null }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8 py-8"
    >
      <div className="space-y-4">
        <h2 className={`text-3xl sm:text-4xl font-bold transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          What type of project is this?
        </h2>
        <p className={`text-lg transition-colors duration-300 ${
          isDark ? 'text-white/70' : 'text-gray-600'
        }`}>
          Choose the option that best describes your project
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto">
        {/* Personal Project Tile */}
        <motion.button
          onClick={() => handleProjectTypeSelect('personal')}
          className={`p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 text-center group ${
            formData.projectType === 'personal'
              ? isDark
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-blue-500 bg-blue-50'
              : isDark
              ? 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700'
              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="space-y-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto ${
              formData.projectType === 'personal'
                ? 'bg-blue-500 text-white'
                : isDark
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Personal Project
            </h3>
            <p className={`text-sm transition-colors duration-300 ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              Individual projects, personal websites, hobby applications, or learning projects
            </p>
          </div>
        </motion.button>

        {/* Commercial Project Tile */}
        <motion.button
          onClick={() => handleProjectTypeSelect('commercial')}
          className={`p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 text-center group ${
            formData.projectType === 'commercial'
              ? isDark
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-blue-500 bg-blue-50'
              : isDark
              ? 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700'
              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="space-y-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto ${
              formData.projectType === 'commercial'
                ? 'bg-blue-500 text-white'
                : isDark
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Commercial Project
            </h3>
            <p className={`text-sm transition-colors duration-300 ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              Business applications, enterprise solutions, or projects for clients and companies
            </p>
          </div>
        </motion.button>
      </div>
      
      {errors.projectType && (
        <div className="text-center">
          <p className="text-red-500 text-sm">{errors.projectType}</p>
        </div>
      )}
    </motion.div>
  );
}

// Step 3: Project Description and Details
function ProjectStep({ isDark, formData, setFormData, errors, setErrors, onValidate }) {
  // Personal project options
  const personalGoals = [
    { label: 'Learn / Upskill', value: 'learn' },
    { label: 'Portfolio project', value: 'portfolio' },
    { label: 'Hobby app', value: 'hobby' },
    { label: 'Freelance client work', value: 'freelance' },
    { label: 'Pre-seed/Seed startup', value: 'startup' },
    { label: 'Other', value: 'other' }
  ];

  // Commercial project options
  const commercialGoals = [
    { label: 'Launch / grow revenue', value: 'revenue' },
    { label: 'Operational efficiency / automation', value: 'efficiency' },
    { label: 'Risk / Security / Compliance', value: 'compliance' },
    { label: 'Improve customer experience', value: 'customer_exp' },
    { label: 'Market test / PoC', value: 'market_test' },
    { label: 'Other', value: 'other' }
  ];

  const projectStages = [
    { label: 'Just exploring / Discovery', value: 'idea' },
    { label: 'Build an MVP', value: 'mvp' },
    { label: 'Scale existing product', value: 'growth' },
    { label: 'Modernize / Migrate', value: 'modernize' },
    { label: 'Staff augmentation', value: 'staffing' },
    { label: 'Maintenance & Support', value: 'support' }
  ];

  const roles = [
    { label: 'Decision maker', value: 'decision_maker' },
    { label: 'Influencer / Recommender', value: 'influencer' },
    { label: 'Research / Evaluator', value: 'researcher' },
    { label: 'Other', value: 'other' }
  ];

  const timelines = [
    { label: 'Immediately', value: 'now' },
    { label: 'Within 3 months', value: '<3mo' },
    { label: '3–6 months', value: '3-6mo' },
    { label: '6+ months', value: '>6mo' },
    { label: 'Not sure', value: 'unsure' }
  ];

  const budgets = [
    { label: 'Under $10k', value: '<10k' },
    { label: '$10–25k', value: '10-25k' },
    { label: '$25–75k', value: '25-75k' },
    { label: '$75–200k', value: '75-200k' },
    { label: '$200k+', value: '200k+' },
    { label: 'Not sure', value: 'unknown' }
  ];

  const targetPlatforms = [
    { label: 'Web', value: 'web' },
    { label: 'Mobile', value: 'mobile' },
    { label: 'Backend/API', value: 'backend' },
    { label: 'Data/Analytics', value: 'data' },
    { label: 'AI/ML', value: 'ai' },
    { label: 'Other', value: 'other' }
  ];

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleDescriptionChange = (e) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: null }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 py-8"
    >
      <div className="text-center space-y-4">
        <h2 className={`text-3xl sm:text-4xl font-bold transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {formData.projectType === 'personal' ? 'Tell us about your personal project' : 'Tell us about your commercial project'}
        </h2>
      </div>

      {/* Business Goal / Primary Goal */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-700'
        }`}>
          {formData.projectType === 'personal' ? 'Primary goal' : 'Business goal'}
        </label>
        <select
          value={formData.primaryGoal || ''}
          onChange={handleInputChange('primaryGoal')}
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm cursor-pointer ${
            errors.primaryGoal
              ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
              : isDark
              ? 'bg-gray-800/50 border-gray-600/50 text-white focus:ring-blue-500 focus:border-blue-500 hover:border-gray-500'
              : 'bg-white/80 border-gray-200 text-gray-900 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300'
          }`}
        >
          <option value="">Select your goal...</option>
          {(formData.projectType === 'personal' ? personalGoals : commercialGoals).map((goal) => (
            <option key={goal.value} value={goal.value}>
              {goal.label}
            </option>
          ))}
        </select>
        {errors.primaryGoal && (
          <p className="text-red-500 text-sm">{errors.primaryGoal}</p>
        )}
      </div>

      {/* Project Description */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-700'
        }`}>
          Project Description
        </label>
        <textarea
          value={formData.description}
          onChange={handleDescriptionChange}
          placeholder="Describe your project, goals, and what you're hoping to achieve..."
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none shadow-sm ${
            errors.description
              ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
              : isDark
              ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-500'
              : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 shadow-sm'
          }`}
          rows={3}
        />
        {errors.description && (
          <p className="text-red-500 text-sm">{errors.description}</p>
        )}
      </div>

      {/* Project Stage */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-700'
        }`}>
          Where are you in your project?
        </label>
        <select
          value={formData.projectStage || ''}
          onChange={handleInputChange('projectStage')}
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm cursor-pointer ${
            errors.projectStage
              ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
              : isDark
              ? 'bg-gray-800/50 border-gray-600/50 text-white focus:ring-blue-500 focus:border-blue-500 hover:border-gray-500'
              : 'bg-white/80 border-gray-200 text-gray-900 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300'
          }`}
        >
          <option value="">Select project stage...</option>
          {projectStages.map((stage) => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
        </select>
        {errors.projectStage && (
          <p className="text-red-500 text-sm">{errors.projectStage}</p>
        )}
      </div>

      {/* Your role in the decision (Commercial only) */}
      {formData.projectType === 'commercial' && (
        <div className="space-y-4">
          <label className={`block text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-700'
          }`}>
            Your role in the decision
          </label>
          <select
            value={formData.role || ''}
            onChange={handleInputChange('role')}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm cursor-pointer ${
              errors.role
                ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
                : isDark
                ? 'bg-gray-800/50 border-gray-600/50 text-white focus:ring-blue-500 focus:border-blue-500 hover:border-gray-500'
                : 'bg-white/80 border-gray-200 text-gray-900 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300'
            }`}
          >
            <option value="">Select your role...</option>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-red-500 text-sm">{errors.role}</p>
          )}
        </div>
      )}

      {/* Target Platforms */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-700'
        }`}>
          Target platforms (choose all that apply)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {targetPlatforms.map((platform) => (
            <button
              key={platform.value}
              type="button"
              onClick={() => handleMultiSelect('targetPlatforms', platform.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 shadow-sm ${
                formData.targetPlatforms?.includes(platform.value)
                  ? isDark
                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                    : 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-300'
                  : isDark
                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:border-gray-500 border border-gray-600/50'
                  : 'bg-white/80 text-gray-700 hover:bg-gray-50 hover:border-gray-300 border border-gray-200'
              }`}
            >
              {platform.label}
            </button>
          ))}
        </div>
        {errors.targetPlatforms && (
          <p className="text-red-500 text-sm">{errors.targetPlatforms}</p>
        )}
      </div>

      {/* Timeline and Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="space-y-4">
          <label className={`block text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-700'
          }`}>
            Timeline
          </label>
          <select
            value={formData.timeline || ''}
            onChange={handleInputChange('timeline')}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm cursor-pointer ${
              errors.timeline
                ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
                : isDark
                ? 'bg-gray-800/50 border-gray-600/50 text-white focus:ring-blue-500 focus:border-blue-500 hover:border-gray-500'
                : 'bg-white/80 border-gray-200 text-gray-900 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300'
            }`}
          >
            <option value="">Select timeline...</option>
            {timelines.map((timeline) => (
              <option key={timeline.value} value={timeline.value}>
                {timeline.label}
              </option>
            ))}
          </select>
          {errors.timeline && (
            <p className="text-red-500 text-sm">{errors.timeline}</p>
          )}
        </div>

        {/* Budget */}
        <div className="space-y-4">
          <label className={`block text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-700'
          }`}>
            Budget (estimate)
          </label>
          <select
            value={formData.budget || ''}
            onChange={handleInputChange('budget')}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm cursor-pointer ${
              errors.budget
                ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
                : isDark
                ? 'bg-gray-800/50 border-gray-600/50 text-white focus:ring-blue-500 focus:border-blue-500 hover:border-gray-500'
                : 'bg-white/80 border-gray-200 text-gray-900 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300'
            }`}
          >
            <option value="">Select budget...</option>
            {budgets.map((budget) => (
              <option key={budget.value} value={budget.value}>
                {budget.label}
              </option>
            ))}
          </select>
          {errors.budget && (
            <p className="text-red-500 text-sm">{errors.budget}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Step 3: Project Details for Construction
function ConstructionProjectStep({ isDark, formData, setFormData, errors, setErrors }) {
  const timelines = [
    { label: 'Immediately', value: 'now' },
    { label: 'Within 3 months', value: '<3mo' },
    { label: '3–6 months', value: '3-6mo' },
    { label: '6–12 months', value: '6-12mo' },
    { label: '12+ months', value: '>12mo' },
    { label: 'Not sure', value: 'unsure' }
  ];

  const budgets = [
    { label: 'Under $25k', value: '<25k' },
    { label: '$25–50k', value: '25-50k' },
    { label: '$50–100k', value: '50-100k' },
    { label: '$100–250k', value: '100-250k' },
    { label: '$250–500k', value: '250-500k' },
    { label: '$500k+', value: '500k+' },
    { label: 'Not sure', value: 'unknown' }
  ];

  const projectStages = [
    { label: 'Planning / Design phase', value: 'planning' },
    { label: 'Ready to start', value: 'ready' },
    { label: 'In progress', value: 'in_progress' },
    { label: 'Need consultation', value: 'consultation' }
  ];

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleDescriptionChange = (e) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: null }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 py-8"
    >
      <div className="text-center space-y-4">
        <h2 className={`text-3xl sm:text-4xl font-bold transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Tell us about your construction project
        </h2>
      </div>

      {/* Project Description */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-700'
        }`}>
          Project Description *
        </label>
        <textarea
          value={formData.description || ''}
          onChange={handleDescriptionChange}
          placeholder="Describe your construction project, including size, scope, and any specific requirements..."
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none shadow-sm ${
            errors.description
              ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
              : isDark
              ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500 hover:border-gray-500'
              : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-orange-500 focus:border-orange-500 hover:border-gray-300'
          }`}
          rows={4}
        />
        {errors.description && (
          <p className="text-red-500 text-sm">{errors.description}</p>
        )}
      </div>

      {/* Square Footage / Size */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-700'
        }`}>
          Project Size (Square Footage)
        </label>
        <input
          type="text"
          value={formData.squareFootage || ''}
          onChange={handleInputChange('squareFootage')}
          placeholder="e.g., 2000 sq ft"
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${
            isDark
              ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500 hover:border-gray-500'
              : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-orange-500 focus:border-orange-500 hover:border-gray-300'
          }`}
        />
      </div>

      {/* Location */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-700'
        }`}>
          Project Location
        </label>
        <input
          type="text"
          value={formData.location || ''}
          onChange={handleInputChange('location')}
          placeholder="City, State or full address"
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${
            isDark
              ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500 hover:border-gray-500'
              : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-orange-500 focus:border-orange-500 hover:border-gray-300'
          }`}
        />
      </div>

      {/* Project Stage */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-700'
        }`}>
          Project Stage *
        </label>
        <select
          value={formData.projectStage || ''}
          onChange={handleInputChange('projectStage')}
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm cursor-pointer ${
            errors.projectStage
              ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
              : isDark
              ? 'bg-gray-800/50 border-gray-600/50 text-white focus:ring-orange-500 focus:border-orange-500 hover:border-gray-500'
              : 'bg-white/80 border-gray-200 text-gray-900 focus:ring-orange-500 focus:border-orange-500 hover:border-gray-300'
          }`}
        >
          <option value="">Select project stage...</option>
          {projectStages.map((stage) => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
        </select>
        {errors.projectStage && (
          <p className="text-red-500 text-sm">{errors.projectStage}</p>
        )}
      </div>

      {/* Special Requirements */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-700'
        }`}>
          Special Requirements (Optional)
        </label>
        <textarea
          value={formData.specialRequirements || ''}
          onChange={handleInputChange('specialRequirements')}
          placeholder="Permits needed, zoning requirements, accessibility needs, etc."
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none shadow-sm ${
            isDark
              ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500 hover:border-gray-500'
              : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-orange-500 focus:border-orange-500 hover:border-gray-300'
          }`}
          rows={3}
        />
      </div>

      {/* Timeline and Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className={`block text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-700'
          }`}>
            Timeline *
          </label>
          <select
            value={formData.timeline || ''}
            onChange={handleInputChange('timeline')}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm cursor-pointer ${
              errors.timeline
                ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
                : isDark
                ? 'bg-gray-800/50 border-gray-600/50 text-white focus:ring-orange-500 focus:border-orange-500 hover:border-gray-500'
                : 'bg-white/80 border-gray-200 text-gray-900 focus:ring-orange-500 focus:border-orange-500 hover:border-gray-300'
            }`}
          >
            <option value="">Select timeline...</option>
            {timelines.map((timeline) => (
              <option key={timeline.value} value={timeline.value}>
                {timeline.label}
              </option>
            ))}
          </select>
          {errors.timeline && (
            <p className="text-red-500 text-sm">{errors.timeline}</p>
          )}
        </div>

        <div className="space-y-4">
          <label className={`block text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-700'
          }`}>
            Budget (estimate) *
          </label>
          <select
            value={formData.budget || ''}
            onChange={handleInputChange('budget')}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm cursor-pointer ${
              errors.budget
                ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
                : isDark
                ? 'bg-gray-800/50 border-gray-600/50 text-white focus:ring-orange-500 focus:border-orange-500 hover:border-gray-500'
                : 'bg-white/80 border-gray-200 text-gray-900 focus:ring-orange-500 focus:border-orange-500 hover:border-gray-300'
            }`}
          >
            <option value="">Select budget...</option>
            {budgets.map((budget) => (
              <option key={budget.value} value={budget.value}>
                {budget.label}
              </option>
            ))}
          </select>
          {errors.budget && (
            <p className="text-red-500 text-sm">{errors.budget}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Step 3: Project Details for Manufacturing
function ManufacturingProjectStep({ isDark, formData, setFormData, errors, setErrors }) {
  const timelines = [
    { label: 'Immediately', value: 'now' },
    { label: 'Within 1 month', value: '<1mo' },
    { label: '1–3 months', value: '1-3mo' },
    { label: '3–6 months', value: '3-6mo' },
    { label: '6+ months', value: '>6mo' },
    { label: 'Not sure', value: 'unsure' }
  ];

  const budgets = [
    { label: 'Under $10k', value: '<10k' },
    { label: '$10–25k', value: '10-25k' },
    { label: '$25–50k', value: '25-50k' },
    { label: '$50–100k', value: '50-100k' },
    { label: '$100–250k', value: '100-250k' },
    { label: '$250k+', value: '250k+' },
    { label: 'Not sure', value: 'unknown' }
  ];

  const projectStages = [
    { label: 'Design / CAD ready', value: 'design' },
    { label: 'Prototype needed', value: 'prototype' },
    { label: 'Ready for production', value: 'ready' },
    { label: 'Need consultation', value: 'consultation' }
  ];

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleDescriptionChange = (e) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: null }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 py-8"
    >
      <div className="text-center space-y-4">
        <h2 className={`text-3xl sm:text-4xl font-bold transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Tell us about your manufacturing project
        </h2>
      </div>

      {/* Project Description */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-700'
        }`}>
          Project Description *
        </label>
        <textarea
          value={formData.description || ''}
          onChange={handleDescriptionChange}
          placeholder="Describe your product, components, or manufacturing needs..."
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none shadow-sm ${
            errors.description
              ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
              : isDark
              ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:ring-green-500 focus:border-green-500 hover:border-gray-500'
              : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-500 focus:border-green-500 hover:border-gray-300'
          }`}
          rows={4}
        />
        {errors.description && (
          <p className="text-red-500 text-sm">{errors.description}</p>
        )}
      </div>

      {/* Quantity / Volume */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-700'
        }`}>
          Quantity / Volume
        </label>
        <input
          type="text"
          value={formData.quantity || ''}
          onChange={handleInputChange('quantity')}
          placeholder="e.g., 100 units, 1000 pieces, etc."
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${
            isDark
              ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:ring-green-500 focus:border-green-500 hover:border-gray-500'
              : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-500 focus:border-green-500 hover:border-gray-300'
          }`}
        />
      </div>

      {/* Materials */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-700'
        }`}>
          Materials / Material Requirements
        </label>
        <input
          type="text"
          value={formData.materials || ''}
          onChange={handleInputChange('materials')}
          placeholder="e.g., Metal, Plastic, Wood, Composite, etc."
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${
            isDark
              ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:ring-green-500 focus:border-green-500 hover:border-gray-500'
              : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-500 focus:border-green-500 hover:border-gray-300'
          }`}
        />
      </div>

      {/* Project Stage */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-700'
        }`}>
          Project Stage *
        </label>
        <select
          value={formData.projectStage || ''}
          onChange={handleInputChange('projectStage')}
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm cursor-pointer ${
            errors.projectStage
              ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
              : isDark
              ? 'bg-gray-800/50 border-gray-600/50 text-white focus:ring-green-500 focus:border-green-500 hover:border-gray-500'
              : 'bg-white/80 border-gray-200 text-gray-900 focus:ring-green-500 focus:border-green-500 hover:border-gray-300'
          }`}
        >
          <option value="">Select project stage...</option>
          {projectStages.map((stage) => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
        </select>
        {errors.projectStage && (
          <p className="text-red-500 text-sm">{errors.projectStage}</p>
        )}
      </div>

      {/* Quality Standards / Certifications */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-700'
        }`}>
          Quality Standards / Certifications Needed (Optional)
        </label>
        <input
          type="text"
          value={formData.qualityStandards || ''}
          onChange={handleInputChange('qualityStandards')}
          placeholder="e.g., ISO 9001, FDA, CE marking, etc."
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${
            isDark
              ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:ring-green-500 focus:border-green-500 hover:border-gray-500'
              : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-500 focus:border-green-500 hover:border-gray-300'
          }`}
        />
      </div>

      {/* Timeline and Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className={`block text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-700'
          }`}>
            Timeline *
          </label>
          <select
            value={formData.timeline || ''}
            onChange={handleInputChange('timeline')}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm cursor-pointer ${
              errors.timeline
                ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
                : isDark
                ? 'bg-gray-800/50 border-gray-600/50 text-white focus:ring-green-500 focus:border-green-500 hover:border-gray-500'
                : 'bg-white/80 border-gray-200 text-gray-900 focus:ring-green-500 focus:border-green-500 hover:border-gray-300'
            }`}
          >
            <option value="">Select timeline...</option>
            {timelines.map((timeline) => (
              <option key={timeline.value} value={timeline.value}>
                {timeline.label}
              </option>
            ))}
          </select>
          {errors.timeline && (
            <p className="text-red-500 text-sm">{errors.timeline}</p>
          )}
        </div>

        <div className="space-y-4">
          <label className={`block text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-700'
          }`}>
            Budget (estimate) *
          </label>
          <select
            value={formData.budget || ''}
            onChange={handleInputChange('budget')}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm cursor-pointer ${
              errors.budget
                ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
                : isDark
                ? 'bg-gray-800/50 border-gray-600/50 text-white focus:ring-green-500 focus:border-green-500 hover:border-gray-500'
                : 'bg-white/80 border-gray-200 text-gray-900 focus:ring-green-500 focus:border-green-500 hover:border-gray-300'
            }`}
          >
            <option value="">Select budget...</option>
            {budgets.map((budget) => (
              <option key={budget.value} value={budget.value}>
                {budget.label}
              </option>
            ))}
          </select>
          {errors.budget && (
            <p className="text-red-500 text-sm">{errors.budget}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Step 4: Contact Information
function ContactStep({ isDark, formData, setFormData, errors, setErrors }) {
  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear field errors when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 py-8"
    >
      <div className="text-center space-y-4">
        <h2 className={`text-3xl sm:text-4xl font-bold transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          How can we reach you?
        </h2>
        <p className={`text-lg transition-colors duration-300 ${
          isDark ? 'text-white/70' : 'text-gray-600'
        }`}>
          We'll use this information to get in touch about your project.
        </p>
      </div>

      <div className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-700'
          }`}>
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={handleInputChange('name')}
            placeholder="Enter your full name"
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${
              errors.name
                ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
                : isDark
                ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-500'
                : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300'
            }`}
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-700'
          }`}>
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            placeholder="Enter your email address"
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${
              errors.email
                ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
                : isDark
                ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-500'
                : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>

        {/* Phone (Optional) */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-700'
          }`}>
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={handleInputChange('phone')}
            placeholder="Enter your phone number"
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${
              isDark
                ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-500'
                : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300'
            }`}
          />
        </div>

        {/* Honeypot field - hidden from users but visible to bots */}
        <input
          type="text"
          name="website"
          value={formData.website}
          onChange={handleInputChange('website')}
          tabIndex="-1"
          autoComplete="off"
          style={{
            position: 'absolute',
            left: '-9999px',
            opacity: 0,
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        />

        {/* Company (Optional) */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-700'
          }`}>
            Company/Organization (Optional)
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={handleInputChange('company')}
            placeholder="Enter your company name"
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${
              isDark
                ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-500'
                : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300'
            }`}
          />
        </div>

        {/* Submission Error */}
        {errors.submission && (
          <div className="text-center">
            <p className="text-red-500 text-sm">{errors.submission}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Step 5: Confirmation
function ConfirmationStep({ isDark, formData, onScrollToTools }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8 py-8"
    >
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className={`text-3xl sm:text-4xl font-bold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Thank you!
            </h2>
          
          <p className={`text-lg leading-relaxed transition-colors duration-300 ${
            isDark ? 'text-white/70' : 'text-gray-600'
          }`}>
            We've received your information and will get back to you within 24 hours.
          </p>
        </div>

        <div className={`p-6 rounded-lg border-2 max-w-md mx-auto ${
          isDark 
            ? 'bg-gray-800 border-gray-600' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            What's next?
          </h3>
          <ul className={`space-y-2 text-sm transition-colors duration-300 ${
            isDark ? 'text-white/70' : 'text-gray-600'
          }`}>
            <li>• We'll review your project details</li>
            <li>• Our team will prepare a customized proposal</li>
            <li>• We'll schedule a consultation call</li>
            <li>• You'll receive our detailed project plan</li>
          </ul>
        </div>

        <div className="space-y-4 pt-16">
          <button
            onClick={onScrollToTools}
            className="inline-flex items-center px-6 py-3 text-white font-medium hover:text-white transition-colors duration-300 focus:outline-none border-none group"
          >
            <span className="text-white">Explore Our Tools</span>
            <svg className="w-4 h-4 ml-2 group-hover:translate-y-1 transition-transform duration-300 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Main Lead Generation Form Component
const LeadGenerationForm = forwardRef(function LeadGenerationForm({ isDark, skipStep0 = false, serviceType = 'software' }, ref) {
  const { user, supabase } = useAuth();
  const [userData, setUserData] = useState(null);
  const [currentStep, setCurrentStep] = useState(skipStep0 ? 0 : 0); // Start at 0, but we'll adjust stepper
  const [interestsAlign, setInterestsAlign] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Handle step change
  const handleStepChange = (step) => {
    // Clear errors when moving to a new step
    setErrors({});
    setCurrentStep(step);
  };

  // Expose method to parent component
  useImperativeHandle(ref, () => ({
    advanceToStep: (step) => {
      handleStepChange(step);
    }
  }));

  // Handle interests alignment
  const handleInterestsAlign = (align) => {
    setInterestsAlign(align);
  };

  const handleInterestsChange = (selection, align, hasBored) => {
    // You can add additional logic here if needed
    console.log('Interests changed:', { selection, align, hasBored });
  };

  // Handle service selection
  const handleServiceSelect = (service) => {
    setSelectedService(service);
    if (service === 'software') {
      // Trigger step change through the stepper
      handleStepChange(1);
    }
  };

  // Fetch user data if user is signed in
  React.useEffect(() => {
    const fetchUserData = async () => {
      if (user && supabase) {
        try {
          // Get the session token from Supabase
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            return;
          }

          const response = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user, supabase]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    description: '',
    projectType: '',
    projectStage: '',
    primaryGoal: '',
    role: '',
    targetPlatforms: [],
    timeline: '',
    budget: '',
    // Construction-specific fields
    squareFootage: '',
    location: '',
    specialRequirements: '',
    // Manufacturing-specific fields
    quantity: '',
    materials: '',
    qualityStandards: '',
    website: '' // Honeypot field - should remain empty
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation for step 2 (project type selection)
  const validateProjectTypeStep = () => {
    const newErrors = {};

    if (!formData.projectType) {
      newErrors.projectType = 'Please select a project type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle step 2 next (project type validation) - adjusted for skipStep0
  const handleStep2Next = () => {
    return validateProjectTypeStep();
  };

  // Form validation for step 3 (project step)
  const validateProjectStep = () => {
    const newErrors = {};

    if (!formData.description?.trim()) {
      newErrors.description = 'Please describe your project';
    }
    if (!formData.projectStage) {
      newErrors.projectStage = 'Please select where you are in your project';
    }
    
    // Software-specific validations
    if (serviceType === 'software') {
      if (!formData.primaryGoal) {
        newErrors.primaryGoal = 'Please select your primary goal';
      }
      if (formData.projectType === 'commercial' && !formData.role) {
        newErrors.role = 'Please select your role in the decision';
      }
      if (!formData.targetPlatforms || formData.targetPlatforms.length === 0) {
        newErrors.targetPlatforms = 'Please select at least one target platform';
      }
    }
    
    if (!formData.timeline) {
      newErrors.timeline = 'Please select a timeline';
    }
    if (!formData.budget) {
      newErrors.budget = 'Please select a budget range';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle step 3 next (project form validation)
  const handleStep3Next = () => {
    return validateProjectStep();
  };

  // Form validation for step 4 (contact step)
  const validateContactStep = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle step 4 next (contact form submission)
  const handleStep4Next = async () => {
    if (!validateContactStep()) {
      return false;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit lead');
      }

      console.log('Lead submitted successfully:', result);
      
      // Track conversion
      if (typeof window !== 'undefined' && typeof gtag_report_conversion === 'function') {
        gtag_report_conversion();
      }
      
      return true; // Success
    } catch (error) {
      console.error('Error submitting lead:', error);
      // Set error state for user feedback
      setErrors(prev => ({ 
        ...prev, 
        submission: error.message || 'Failed to submit lead. Please try again.' 
      }));
      return false; // Failure
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCurrentStepChange = (step) => {
    setCurrentStep(step);
  };

  const handleFinalStepCompleted = () => {
    // Reset form after successful submission
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      description: '',
      projectType: '',
      projectStage: '',
      primaryGoal: '',
      role: '',
      targetPlatforms: [],
      timeline: '',
      budget: '',
      // Construction-specific fields
      squareFootage: '',
      location: '',
      specialRequirements: '',
      // Manufacturing-specific fields
      quantity: '',
      materials: '',
      qualityStandards: '',
      website: '' // Honeypot field - should remain empty
    });
  };

  const handleScrollToTools = () => {
    const toolsSection = document.querySelector('[data-section="tools"]');
    if (toolsSection) {
      const rect = toolsSection.getBoundingClientRect();
        const offset = 65; // Adjust this value to change the offset
      window.scrollTo({
        top: window.scrollY + rect.top - offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={`max-w-5xl md:max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 pt-4 ${currentStep === (skipStep0 ? 4 : 5) ? 'pb-0' : 'pb-1'}`}>
      <Stepper
        initialStep={0}
        onStepChange={handleStepChange}
        onCurrentStepChange={handleCurrentStepChange}
        onFinalStepCompleted={handleFinalStepCompleted}
        onStep2Next={skipStep0 ? (currentStep === 1 ? handleStep2Next : null) : (currentStep === 2 ? handleStep2Next : null)}
        onStep3Next={skipStep0 ? (currentStep === 2 ? handleStep3Next : null) : (currentStep === 3 ? handleStep3Next : null)}
        onStep4Next={skipStep0 ? (currentStep === 3 ? handleStep4Next : null) : (currentStep === 4 ? handleStep4Next : null)}
        backButtonText="Back"
        nextButtonText="Continue"
        canProceedFromStep0={interestsAlign}
        externalStep={currentStep}
      >
        {!skipStep0 && (
          <Step>
            <ServiceSelectionStep 
              isDark={isDark}
              onServiceSelect={handleServiceSelect}
            />
          </Step>
        )}
        <Step>
          <WelcomeStep 
            isDark={isDark}
            user={user}
            userData={userData}
            onInterestsAlign={handleInterestsAlign}
            onInterestsChange={handleInterestsChange}
            serviceType={serviceType}
          />
        </Step>
        
        <Step>
          {serviceType === 'construction' ? (
            <ConstructionProjectTypeStep 
              isDark={isDark} 
              formData={formData} 
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
            />
          ) : serviceType === 'manufacturing' ? (
            <ManufacturingProjectTypeStep 
              isDark={isDark} 
              formData={formData} 
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
            />
          ) : (
            <ProjectTypeStep 
              isDark={isDark} 
              formData={formData} 
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
            />
          )}
        </Step>
        
        <Step>
          {serviceType === 'construction' ? (
            <ConstructionProjectStep 
              isDark={isDark} 
              formData={formData} 
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
            />
          ) : serviceType === 'manufacturing' ? (
            <ManufacturingProjectStep 
              isDark={isDark} 
              formData={formData} 
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
            />
          ) : (
            <ProjectStep 
              isDark={isDark} 
              formData={formData} 
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
            />
          )}
        </Step>
        
        <Step>
          <ContactStep 
            isDark={isDark} 
            formData={formData} 
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
          />
        </Step>
        
        <Step>
          <ConfirmationStep 
            isDark={isDark} 
            formData={formData}
            onScrollToTools={handleScrollToTools}
          />
        </Step>
      </Stepper>
    </div>
  );
});

export default LeadGenerationForm;
