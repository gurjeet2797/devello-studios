import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../Layout';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../auth/AuthProvider';
import { useModal } from '../ModalProvider';
import { useRouter } from 'next/router';

// Custom hook to safely use theme context
function useSafeTheme() {
  const themeContext = useTheme();
  return themeContext ? themeContext.isDark : true;
}

export default function AboutPage() {
  const isDark = useSafeTheme();
  const videoRef = useRef(null);
  const { user } = useAuth();
  const { openAuthModal } = useModal();
  const router = useRouter();

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleEnded = () => {
        // Video has ended, keep it on the last frame
        video.pause();
      };
      
      video.addEventListener('ended', handleEnded);
      
      // Play the video once when component mounts or when it's visible
      const playVideo = () => {
        video.play().catch(err => {
          console.log('Video autoplay prevented:', err);
        });
      };
      
      // 1 second delay before video starts playing
      const timer = setTimeout(playVideo, 1000);
      
      return () => {
        clearTimeout(timer);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  return (
    <div className={`min-h-screen w-full ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col items-center justify-start w-full h-full pt-24 sm:pt-32 pb-16"
      >
        {/* Hero Section */}
        <div className="text-center space-y-6 pb-8 w-full max-w-2xl sm:max-w-4xl mx-auto px-6 sm:px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold transition-colors duration-1000 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              About Devello.
            </h1>
            <p className={`text-base sm:text-lg md:text-xl mt-6 leading-relaxed font-light max-w-3xl mx-auto transition-colors duration-1000 ${
              isDark ? 'text-white/60' : 'text-gray-600'
            }`}>
              Building solutions that bridge physical and digital worlds
            </p>
          </motion.div>
        </div>

        {/* Section 1: Our Foundation */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-2xl sm:max-w-4xl mx-auto px-6 sm:px-4 md:px-6 lg:px-8 pt-8 sm:pt-16 pb-16"
        >
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
            {/* Video/Visual */}
            <div className="w-full lg:w-1/2">
              <div 
                className="about-devello-glass relative rounded-[2.5rem] overflow-hidden shadow-xl"
                style={{
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                  backgroundColor: isDark 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(255, 255, 255, 0.3)',
                  borderColor: isDark 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.1)',
                  borderWidth: '1px'
                }}
              >
                <div className="aspect-[4/3] relative">
                  <video
                    ref={videoRef}
                    src="https://video.wixstatic.com/video/c6bfe7_b80e23d1ffc34b71a551924a8d3181e1/720p/mp4/file.mp4"
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    loop={false}
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="w-full lg:w-1/2 space-y-6">
              <div className="mb-4">
                <h2 className={`text-3xl sm:text-4xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Our Foundation
                </h2>
              </div>
              
              <p className={`text-base sm:text-lg leading-relaxed ${
                isDark ? 'text-white/80' : 'text-gray-700'
              }`}>
                Devello, derived from the old Latin verb meaning "to pull off," embodies our philosophy of achieving success against seemingly insurmountable challenges. Founded in 2019 with a commitment to precision and innovation, we have built not just physical foundations but the groundwork for a lasting legacy of craftsmanship.
              </p>
              
              <p className={`text-base sm:text-lg leading-relaxed ${
                isDark ? 'text-white/80' : 'text-gray-700'
              }`}>
                With roots in Aeronautical Engineering, we bring precision and exacting standards to every element we craft. Engineering principles—critical thinking, problem-solving, and purposeful design—form the foundation of everything we build, ensuring each piece meets the highest standards of quality.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section 2: Our Vision */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-2xl sm:max-w-4xl mx-auto px-6 sm:px-4 md:px-6 lg:px-8 pt-8 sm:pt-16 pb-16"
        >
          <div className="flex flex-col lg:flex-row-reverse gap-8 lg:gap-12 items-center">
            {/* Image/Visual */}
            <div className="w-full lg:w-1/2">
              <div className={`relative rounded-3xl overflow-hidden shadow-xl ${
                isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
              }`}>
                <div className="aspect-[4/3] relative">
                  <Image
                    src="https://static.wixstatic.com/media/c6bfe7_8230572451024c4f9d91a2c56139d589~mv2.jpg"
                    alt="Building the Future"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="w-full lg:w-1/2 space-y-6">
              <div className="mb-4">
                <h2 className={`text-3xl sm:text-4xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Building the Future
                </h2>
              </div>
              
              <p className={`text-base sm:text-lg leading-relaxed ${
                isDark ? 'text-white/80' : 'text-gray-700'
              }`}>
                Today, Devello operates as an ecosystem where design excellence meets masterful execution. We're expanding beyond construction into a comprehensive network that connects clients with expert partners across three core areas: construction, software development, and business consultation services.
              </p>
              
              <p className={`text-base sm:text-lg leading-relaxed ${
                isDark ? 'text-white/80' : 'text-gray-700'
              }`}>
                Our mission is to build not only structures, but systems and experiences that endure. Every window, door, and custom piece reflects our obsession with quality. We're crafting a legacy that bridges the physical and digital worlds, redefining what it means to be a builder in the 21st century.
              </p>

              {/* Services Grid */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                {/* Construction - Link to Construction Page */}
                <Link href="/construction" className="block">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 sm:p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
                      isDark 
                        ? 'bg-orange-500/20 border-orange-400/30 hover:bg-orange-500/30 hover:border-orange-400/50' 
                        : 'bg-orange-100/50 border-orange-300/50 hover:bg-orange-100 hover:border-orange-400'
                    }`}
                  >
                    <h3 className={`text-sm sm:text-base font-semibold mb-1 break-words ${
                      isDark ? 'text-orange-300' : 'text-orange-700'
                    }`}>
                      Construction
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed break-words ${
                      isDark ? 'text-orange-200/80' : 'text-orange-600'
                    }`}>
                      Quality work & partnerships
                    </p>
                  </motion.div>
                </Link>
                
                {/* Software Development - Link to Software Page */}
                <a href="https://devellotech.com" target="_blank" rel="noopener noreferrer" className="block">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 sm:p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
                      isDark 
                        ? 'bg-sky-400/20 border-sky-400/30 hover:bg-sky-400/30 hover:border-sky-400/50' 
                        : 'bg-sky-100/50 border-sky-300/50 hover:bg-sky-100 hover:border-sky-400'
                    }`}
                  >
                    <h3 className={`text-sm sm:text-base font-semibold mb-1 break-words ${
                      isDark ? 'text-sky-300' : 'text-sky-700'
                    }`}>
                      Software Development
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed break-words ${
                      isDark ? 'text-sky-200/80' : 'text-sky-600'
                    }`}>
                      Digital solutions & platforms
                    </p>
                  </motion.div>
                </a>
                
                {/* Business Consultation - Link to Consulting Page */}
                <Link href="/consulting" className="block">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 sm:p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
                      isDark 
                        ? 'bg-amber-400/20 border-amber-300/30 hover:bg-amber-400/30 hover:border-amber-300/50' 
                        : 'bg-amber-100/50 border-amber-300/50 hover:bg-amber-100 hover:border-amber-400'
                    }`}
                  >
                    <h3 className={`text-sm sm:text-base font-semibold mb-1 break-words ${
                      isDark ? 'text-amber-200' : 'text-amber-600'
                    }`}>
                      Business Consultation
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed break-words ${
                      isDark ? 'text-amber-100/80' : 'text-amber-700'
                    }`}>
                      Expert business guidance
                    </p>
                  </motion.div>
                </Link>
                
                {/* Store - Link to Store Page */}
                <Link href="/custom" className="block">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 sm:p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
                      isDark 
                        ? 'bg-green-500/20 border-green-400/30 hover:bg-green-500/30 hover:border-green-400/50' 
                        : 'bg-green-100/50 border-green-300/50 hover:bg-green-100 hover:border-green-400'
                    }`}
                  >
                    <h3 className={`text-sm sm:text-base font-semibold mb-1 break-words ${
                      isDark ? 'text-green-300' : 'text-green-700'
                    }`}>
                      Store
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed break-words ${
                      isDark ? 'text-green-200/80' : 'text-green-600'
                    }`}>
                      Browse products
                    </p>
                  </motion.div>
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section 3: The Platform Model */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="w-full max-w-2xl sm:max-w-4xl mx-auto px-6 sm:px-4 md:px-6 lg:px-8 pt-8 sm:pt-16 pb-16"
        >
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                The Platform Model
              </h2>
              
              <p className={`text-base sm:text-lg leading-relaxed max-w-3xl mx-auto ${
                isDark ? 'text-white/80' : 'text-gray-700'
              }`}>
                Devello operates as a platform that connects clients with expert partners across all building services. We're building a network of trusted professionals who share our commitment to quality and excellence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-2xl border ${
                isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Construction Partners
                </h3>
                <p className={`text-sm leading-relaxed ${
                  isDark ? 'text-white/70' : 'text-gray-600'
                }`}>
                  We sign on construction vendors to build in the real world. Our network of trusted partners ensures quality workmanship and reliable service for every physical construction project.
                </p>
              </div>

              <div className={`p-6 rounded-2xl border ${
                isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Software Development Partners
                </h3>
                <p className={`text-sm leading-relaxed ${
                  isDark ? 'text-white/70' : 'text-gray-600'
                }`}>
                  We partner with software development and IT solutions vendors to offer digital construction services. These partners help us deliver innovative software solutions and digital platforms to clients.
                </p>
              </div>

              <div className={`p-6 rounded-2xl border ${
                isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Business Consultation Partners
                </h3>
                <p className={`text-sm leading-relaxed ${
                  isDark ? 'text-white/70' : 'text-gray-600'
                }`}>
                  We sign on established business consultants from all industries to connect people with individuals who can help them build businesses or solve unique problems. Our consultant network provides expert guidance across diverse sectors.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Become a Partner Section */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full max-w-2xl sm:max-w-4xl lg:max-w-7xl mx-auto px-6 sm:px-4 md:px-6 lg:px-8 pt-8 sm:pt-16 pb-16"
          id="become-partner"
        >
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">
            {/* Partnership label - Mobile: above image, Desktop: in right column */}
            <div className={`lg:hidden flex items-center gap-2 text-xs sm:text-sm font-medium mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <span>Partnership</span>
              <svg className={`w-3 h-3 sm:w-4 sm:h-4 rotate-90 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Left Column - Image and Button */}
            <div className="lg:w-1/2 flex flex-col lg:pr-8">
              {/* Top: Image */}
              <div className={`relative rounded-3xl overflow-hidden shadow-xl w-full ${
                isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
              }`}>
                <div className="aspect-[4/3] relative" style={{ minHeight: '300px' }}>
                  <Image
                    src="https://static.wixstatic.com/media/c6bfe7_e2ea312fa2de4d499f4706fbb8b2b921~mv2.png"
                    alt="Become a Partner"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
              
              {/* Bottom: Apply now Button - Centered in remaining space */}
              <div className="flex justify-center items-center flex-1 mt-8 mb-0 pb-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (user) {
                      router.push('/partners');
                    } else {
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('apply_now_redirect', 'true');
                        sessionStorage.setItem('partners_redirect_path', '/partners');
                      }
                      openAuthModal('signin', { redirectPath: '/partners', fromApplyNow: true });
                    }
                  }}
                  className="about-devello-glass w-auto sm:w-full lg:w-auto px-6 py-3 rounded-full font-medium transition-all duration-300"
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  style={{ 
                    transformOrigin: "center center",
                    textShadow: isDark 
                      ? '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3), 0 0 30px rgba(255, 255, 255, 0.2)'
                      : '0 0 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  Apply now
                </motion.button>
              </div>
            </div>

            {/* Right Column - Text Content */}
            <div className="lg:w-1/2 space-y-6 flex flex-col lg:pl-8">
              <div className={`hidden lg:flex items-center gap-2 text-xs sm:text-sm font-medium ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <span>Partnership</span>
                <svg className={`w-3 h-3 sm:w-4 sm:h-4 rotate-0 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <h2 className={`text-4xl font-bold leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <span className={`${isDark ? 'text-gray-300' : 'text-black'}`}>
                  Become a Partner.
                </span>
              </h2>
              
              <p className={`text-sm sm:text-base leading-relaxed pb-4 sm:pb-6 ${
                isDark ? 'text-white/70' : 'text-gray-600'
              }`}>
                Devello is building a platform for innovative solutions that bridge physical and digital construction. We're seeking partners who share our vision of enduring growth and meaningful impact.
              </p>

              <ul className={`space-y-3 text-sm sm:text-base ${
                isDark ? 'text-white/70' : 'text-gray-600'
              }`}>
                <li className="flex items-start gap-3">
                  <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Investment opportunities to accelerate growth</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Strategic partnerships across industries</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Construction, software, and consulting collaboration</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Join a network of trusted professionals</span>
                </li>
              </ul>

            </div>
          </div>
        </motion.section>

        {/* Section 4: Our Values */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05 }}
          className="w-full max-w-2xl sm:max-w-4xl mx-auto px-6 sm:px-4 md:px-6 lg:px-8 pt-8 sm:pt-16 pb-16"
        >
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              What Drives Us
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              "A good business is marketed; a great business is recommended."
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Quality",
                description: "Precision and workmanship in every project, built on engineering principles."
              },
              {
                title: "Trust",
                description: "Client relationships grounded in consistency and integrity drive our return clientele."
              },
              {
                title: "Innovation",
                description: "Endurance and adaptability—turning challenges into opportunities for growth."
              }
            ].map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className={`p-6 rounded-2xl border ${
                  isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'
                } text-center`}
              >
                <h3 className={`text-xl font-bold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {value.title}
                </h3>
                <p className={`text-sm leading-relaxed ${
                  isDark ? 'text-white/70' : 'text-gray-600'
                }`}>
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Clients of Devello Section */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="w-full max-w-2xl sm:max-w-4xl mx-auto px-6 sm:px-4 md:px-6 lg:px-8 pt-8 sm:pt-16 pb-16"
        >
          <div className="text-center mb-12">
            <div className="mb-4">
              <h2 className={`text-3xl sm:text-4xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Clients of Devello
              </h2>
            </div>
            <p className={`text-lg max-w-2xl mx-auto ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              Trusted by businesses and individuals who value quality and reliability
            </p>
          </div>

          <div className={`rounded-2xl p-8 md:p-12 ${
            isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className={`text-xl font-semibold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Construction Clients
                </h3>
                <p className={`leading-relaxed mb-4 ${
                  isDark ? 'text-white/80' : 'text-gray-700'
                }`}>
                  Our construction services have earned the trust of homeowners and businesses across the region. We've built lasting relationships through consistent quality, timely delivery, and transparent communication.
                </p>
                <div className="space-y-2">
                  <div className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    • Residential renovations and custom millwork
                  </div>
                  <div className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    • Commercial interior projects
                  </div>
                  <div className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    • Design consultation services
                  </div>
                </div>
              </div>
              <div>
                <h3 className={`text-xl font-semibold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Software Clients
                </h3>
                <p className={`leading-relaxed mb-4 ${
                  isDark ? 'text-white/80' : 'text-gray-700'
                }`}>
                  Our digital solutions help businesses streamline operations, enhance user experiences, and build scalable platforms. We work with startups, established companies, and organizations looking to modernize their digital infrastructure.
                </p>
                <div className="space-y-2">
                  <div className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    • Custom software development
                  </div>
                  <div className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    • AI-powered tools and platforms
                  </div>
                  <div className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    • Business consultation services
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Spacing at bottom */}
        <div className="pb-16" />
      </motion.div>
    </div>
  );
}

