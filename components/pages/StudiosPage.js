import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useTheme } from '../Layout';
import Waves from '../Waves';
import CustomBuildsButton from '../CustomBuildsAd';
import Galaxy from '../ui/Galaxy/Galaxy';

// Blog data - in a real app this would come from a CMS or API
const blogPosts = [
  {
    id: 'how-to-build-in-the-digital',
    title: 'How to build in the digital',
    date: 'January 15, 2025',
    excerpt: 'The introduction of digital intelligence has paved the way for learning and rapid implementation of ideas, transforming how we approach creative problem-solving and innovation in the modern world.',
    image: 'https://static.wixstatic.com/media/c6bfe7_0ec340209c274e71aa851207c96ffa08~mv2.jpg',
    author: {
      name: 'Gurjeet Singh',
      avatar: 'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=GS'
    }
  },
  {
    id: 'the-art-of-creation',
    title: 'The art of creation',
    date: 'December 8, 2024',
    excerpt: 'Exploring the relationship between creative freedom and the mental constraints such freedom introduces, revealing how boundaries can paradoxically enhance artistic expression.',
    image: 'https://static.wixstatic.com/media/c6bfe7_2e812517604847d399db3f92b705f817~mv2.jpg',
    author: {
      name: 'Gurjeet Singh',
      avatar: 'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=GS'
    }
  },
  {
    id: 'what-are-tools',
    title: 'What are tools?',
    date: 'June 14, 2025',
    excerpt: 'How the unique ability of humans to craft and use tools has helped change the course of history, from primitive implements to digital technologies.',
    image: 'https://static.wixstatic.com/media/c6bfe7_af0b5bfe632b49ec9d0d0e3a92e7a1d3~mv2.jpg',
    author: {
      name: 'Gurjeet Singh',
      avatar: 'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=GS'
    }
  }
];

// Custom hook to safely use theme context
function useSafeTheme() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const themeContext = useTheme();
  return themeContext ? themeContext.isDark : true;
}

// General Edit Card Component
function GeneralEditCard({ router, isDark }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth <= 1024;
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      
      setIsMobile(isTouchDevice || isTablet || isMobile);
    };
    checkTouchDevice();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkTouchDevice);
      return () => window.removeEventListener('resize', checkTouchDevice);
    }
  }, []);

  useEffect(() => {
    if (isMobile) {
      const interval = setInterval(() => {
        setIsHovered(prev => !prev);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isMobile]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="relative w-full max-w-[22rem] sm:max-w-80 h-[500px] rounded-3xl overflow-hidden shadow-2xl cursor-pointer group"
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onClick={() => router.push('/general-edit')}
    >
      {/* Background Images with Transition */}
      <div className="absolute inset-0">
        {/* First Image */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            isHovered ? "opacity-0" : "opacity-100"
          }`}
        >
          <Image
            src="https://static.wixstatic.com/media/c6bfe7_d1c131cf53864d99ab2a55050b3eb034~mv2.jpg"
            alt="General Edit - After"
            fill
            className="object-cover"
          />
        </div>

        {/* Second Image (appears on hover) */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src="https://static.wixstatic.com/media/c6bfe7_1c710fd0f3aa491ea7065001dc6bb383~mv2.jpg"
            alt="General Edit - Before"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-8 text-white">
        {/* Top Text */}
        <div className="pt-4" />

        {/* Bottom Content */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl font-light leading-tight text-balance">Image Editor</h1>
            <p className="text-white/70 text-sm leading-relaxed">
              Try our editing studio to perfect your photos
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Product Studio Card Component
function AssistedEditCard({ router, isDark }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
      className="relative w-full max-w-[22rem] sm:max-w-80 h-[500px] rounded-3xl overflow-hidden shadow-2xl cursor-pointer group"
      onClick={() => window.open('https://catalog-editor-989777430052.us-west1.run.app', '_blank')}
    >
      {/* Waves Background */}
      <div className="absolute inset-0 overflow-hidden">
        <Waves
          lineColor={isDark ? "var(--waves-dark)" : "var(--waves-light)"}
          backgroundColor="transparent"
          waveSpeedX={0.02}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={12}
          yGap={36}
        />
        {/* Edge blur masks - only show in dark mode */}
        {isDark && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-black/20 blur-sm" />
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-transparent to-black/20 blur-sm" />
            <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-black/20 blur-sm" />
            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-transparent to-black/20 blur-sm" />
          </div>
        )}
      </div>

      {/* Gradient Overlay - conditional based on theme */}
      <div className={`absolute inset-0 ${
        isDark 
          ? 'bg-gradient-to-t from-black/80 via-black/20 to-transparent'
          : 'bg-gradient-to-t from-white/80 via-white/20 to-transparent'
      }`} />

      {/* Content */}
      <div className={`relative h-full flex flex-col justify-between p-8 ${
        isDark ? 'text-white' : 'text-black'
      }`}>
        {/* Top Text */}
        <div className="pt-4" />

        {/* Bottom Content */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl font-light leading-tight text-balance">Product Studio</h1>
            <p className={`text-sm leading-relaxed ${
              isDark ? 'text-white/70' : 'text-black/70'
            }`}>
              Catalogue image editor.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Professional Lighting Card Component
function LightingCard({ onStart, isDark }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const images = [
    "https://static.wixstatic.com/media/c6bfe7_6f84317aff6844ca994cacbd34139777~mv2.jpg",
    "https://static.wixstatic.com/media/c6bfe7_e192f4323cf5442ab8aaceff92cb235d~mv2.jpg",
    "https://static.wixstatic.com/media/c6bfe7_ff6cb01c72c146849eac476f4204dc30~mv2.jpg"
  ];

  useEffect(() => {
    const checkTouchDevice = () => {
      const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth <= 1024;
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      
      setIsMobile(isTouchDevice || isTablet || isMobile);
    };
    checkTouchDevice();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkTouchDevice);
      return () => window.removeEventListener('resize', checkTouchDevice);
    }
  }, []);

  useEffect(() => {
    if (isMobile) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isMobile, images.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4 }}
      className="relative w-full max-w-[22rem] sm:max-w-80 h-[500px] rounded-3xl overflow-hidden shadow-2xl cursor-pointer group"
      onMouseEnter={() => !isMobile && setCurrentImageIndex(prev => (prev + 1) % images.length)}
      onClick={onStart}
    >
      {/* Background Images with Transition */}
      <div className="absolute inset-0">
        {images.map((image, index) => (
          <div
            key={`lighting-image-${index}`}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              currentImageIndex === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image}
              alt={`Professional Lighting - Image ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-8 text-white">
        {/* Top Text */}
        <div className="pt-4" />

        {/* Bottom Content */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl font-light leading-tight text-balance">Lighting Studio</h1>
            <p className="text-white/70 text-sm leading-relaxed">
              Pick a time of day and let the sun be your lighting director
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function StudiosPage({ onStart }) {
  const router = useRouter();
  const isDark = useSafeTheme();

  return (
    <div className={`min-h-screen w-full ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col items-center justify-start w-full h-full space-y-4 overflow-y-auto"
      >
        {/* Hero Cover Section */}
        <div className="relative w-full overflow-hidden pb-8 md:pb-12">
          <div className="relative w-full h-[30vh] md:h-auto overflow-hidden">
            {/* Mobile Image */}
            <motion.div
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="w-full h-full md:hidden"
            >
              <Image
                src="https://static.wixstatic.com/media/c6bfe7_33942c2c432b4fc88f0ea6ab8e30bfbb~mv2.jpg"
                alt="Devello Studios"
                width={1920}
                height={1080}
                priority
                className="w-full h-full object-cover brightness-110"
                sizes="100vw"
              />
            </motion.div>
            {/* Desktop Image */}
            <motion.div
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="hidden md:block w-full h-auto"
            >
              <Image
                src="https://static.wixstatic.com/media/c6bfe7_553927ea62b8419dbf98955cfae444db~mv2.jpg"
                alt="Devello Studios"
                width={1920}
                height={1080}
                priority
                className="w-full h-auto object-contain brightness-110"
                sizes="100vw"
              />
            </motion.div>
            {/* Bottom Fade Overlay - Always present, extends beyond edge */}
            <div className={`absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t ${
              isDark ? 'from-black via-black/80 to-transparent' : 'from-white via-white/80 to-transparent'
            } pointer-events-none z-[5]`} style={{ bottom: '-1px' }} />
            {/* Go to Apps Button */}
            <div className="absolute top-[75%] md:top-[85%] left-1/2 transform -translate-x-1/2 z-20">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const appsSection = document.querySelector('[data-section="apps"]');
                  if (appsSection) {
                    const offset = 40;
                    const elementPosition = appsSection.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }}
                className="about-devello-glass px-5 py-2.5 md:px-6 md:py-3 rounded-full text-sm md:text-base font-medium transition-all duration-300 border-2"
                style={{ 
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(10px) saturate(150%)',
                  color: '#000000',
                }}
              >
                Go to apps
              </motion.button>
            </div>
          </div>
        </div>

        {/* Build Request Button Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 lg:px-16 pt-8 pb-8 w-full flex justify-center"
        >
          <CustomBuildsButton isDark={isDark} formTitle="create build request" color="blue" buttonSize="large" />
        </motion.div>

        {/* Apps Section */}
        <motion.div 
          data-section="apps"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 lg:px-16 pb-8 ipad-pro-fix w-full pt-12 sm:pt-16"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8 px-4 sm:px-0">
            <h2 className={`text-4xl font-bold transition-colors duration-1000 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Apps.
            </h2>
            <p className={`text-sm transition-colors duration-1000 ${
              isDark ? 'text-white/60' : 'text-gray-600'
            }`}>
              Try our in-house tools
            </p>
          </div>

          {/* Description */}
          <div className="mb-12 px-4 sm:px-0">
            <p className={`text-base leading-relaxed max-w-3xl transition-colors duration-1000 ${
              isDark ? 'text-white/80' : 'text-gray-600'
            }`}>
              The tools below were created by Devello to solve certain problems. The lighting tool allows you to change the sunlight conditions for quickly rendering scenes to make better design decisions. The image editor is our attempt at building our own photoshop tool. We like simple but effective solutions.
            </p>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-16 justify-items-center">
            {/* Professional Lighting Card */}
            <LightingCard onStart={onStart} isDark={isDark} />
            
            {/* Assisted Edit Card */}
            <AssistedEditCard router={router} isDark={isDark} />
            
            {/* General Edit Card */}
            <GeneralEditCard router={router} isDark={isDark} />
          </div>
        </motion.div>

        {/* Blogs Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 lg:px-16 pb-8 ipad-pro-fix w-full mt-16"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8 px-4 sm:px-0">
            <h2 className={`text-4xl font-bold transition-colors duration-1000 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Blogs.
            </h2>
            <p className={`text-sm transition-colors duration-1000 ${
              isDark ? 'text-white/60' : 'text-gray-600'
            }`}>
              Read our latest articles
            </p>
          </div>

          {/* Description */}
          <div className="mb-12 px-4 sm:px-0">
            <p className={`text-base leading-relaxed max-w-3xl transition-colors duration-1000 ${
              isDark ? 'text-white/80' : 'text-gray-600'
            }`}>
              Explore our thoughts on design, technology, and innovation. Our blog covers everything from industry insights to behind-the-scenes stories.
            </p>
          </div>

          {/* Blog Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 px-4 sm:px-0">
            {blogPosts.slice(0, 3).map((post, index) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + (index * 0.1) }}
                className="group cursor-pointer"
                onClick={() => router.push(`/blog/${post.id}`)}
              >
                <div className="relative overflow-hidden rounded-2xl mb-4">
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={400}
                    height={250}
                    className="w-full h-[250px] object-cover transition-transform duration-300 group-hover:scale-105"
                    style={{ objectPosition: 'center 85%' }}
                  />
                </div>
                <h4 className={`text-xl font-bold mb-2 transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {post.title}
                </h4>
                <p className={`text-sm mb-2 transition-colors duration-300 ${
                  isDark ? 'text-white/60' : 'text-gray-600'
                }`}>
                  {post.date}
                </p>
                <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                  isDark ? 'text-white/80' : 'text-gray-700'
                }`}>
                  {post.excerpt}
                </p>
              </motion.article>
            ))}
          </div>

          {/* Blog Link Button */}
          <div className="px-4 sm:px-0">
            <motion.button
              onClick={() => router.push('/blog')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-8 py-4 rounded-full font-medium transition-all duration-300 ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  : 'bg-gray-900 hover:bg-gray-800 text-white border border-gray-300'
              }`}
            >
              View All Blogs
            </motion.button>
          </div>
        </motion.div>

        {/* Learning Tools Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 lg:px-16 pb-8 ipad-pro-fix w-full mt-16"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8 px-4 sm:px-0">
            <h2 className={`text-4xl font-bold transition-colors duration-1000 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Learning tools.
            </h2>
          </div>

          {/* Description */}
          <div className="mb-12 px-4 sm:px-0">
            <p className={`text-base leading-relaxed max-w-3xl transition-colors duration-1000 ${
              isDark ? 'text-white/80' : 'text-gray-600'
            }`}>
              Devello is bringing rapid prototyping of visual storytelling to bring your child's art to life without removing the magic. Stay tuned.
            </p>
          </div>

          {/* Galaxy Component */}
          <div className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden">
            <div className={`relative w-full aspect-[4/3] ${
              isDark ? 'bg-gray-900' : 'bg-gray-100'
            }`}>
              <Galaxy
                density={0.5}
                starSpeed={0.5}
                speed={0.5}
                mouseInteraction={true}
                glowIntensity={0.7}
                repulsionStrength={4}
                twinkleIntensity={0.4}
                rotationSpeed={0.02}
                transparent={false}
                saturation={0.5}
                hueShift={1000}
                className="absolute inset-0"
              />
            </div>
          </div>
        </motion.div>

        {/* Spacing at bottom */}
        <div className="pb-16" />
      </motion.div>
    </div>
  );
}

