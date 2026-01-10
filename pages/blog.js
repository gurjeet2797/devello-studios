import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import SEOComponent from '../components/SEO';
import { useTheme } from '../components/Layout';

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

export default function Blog() {
  const router = useRouter();
  const { isDark } = useTheme();

  return (
    <>
      <SEOComponent 
        title="Blog - Devello Inc"
        description="Insights on digital creativity and innovation. Explore our thoughts on AI tools, creative processes, and the future of digital creation."
        keywords="blog, digital creativity, AI tools, innovation, creative processes, design, development"
        url="https://develloinc.com/blog"
      />
      
      {/* Theme-aware background wrapper */}
      <div className={`min-h-screen transition-colors duration-700 ${
        isDark ? 'bg-black' : 'bg-[var(--light-bg)]'
      }`}>
        <main className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 lg:px-16 py-8 pt-24">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className={`text-4xl font-bold mb-4 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>
              Blog
            </h1>
            <p className={`text-lg transition-colors duration-300 ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              Insights on digital creativity and innovation
            </p>
          </motion.div>

          {/* Main Featured Post */}
          <motion.article 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16 group cursor-pointer"
            onClick={() => router.push(`/blog/${blogPosts[0].id}`)}
          >
            <div className="relative overflow-hidden rounded-2xl mb-6">
              <img
                src={blogPosts[0].image}
                alt={blogPosts[0].title}
                className="w-full h-[400px] object-cover transition-transform duration-300 group-hover:scale-105"
                style={{ objectPosition: 'center 25%' }}
              />
            </div>
            <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
              <div className="flex-1">
                <h3 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {blogPosts[0].title}
                </h3>
                <p className={`text-sm mb-4 transition-colors duration-300 ${
                  isDark ? 'text-white/60' : 'text-gray-600'
                }`}>
                  {blogPosts[0].date}
                </p>
              </div>
              <div className="flex-1">
                <p className={`text-base leading-relaxed mb-4 transition-colors duration-300 ${
                  isDark ? 'text-white/80' : 'text-gray-700'
                }`}>
                  {blogPosts[0].excerpt}
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                    <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
                  </div>
                  <span className={`font-medium transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {blogPosts[0].author.name}
                  </span>
                </div>
              </div>
            </div>
          </motion.article>

          {/* More Posts Section */}
          <div className="mb-16">
            <h3 className={`text-3xl font-bold mb-8 transition-colors duration-1000 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              More Posts
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {blogPosts.slice(1).map((post, index) => (
                <motion.article 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (index * 0.1) }}
                  className="group cursor-pointer"
                  onClick={() => router.push(`/blog/${post.id}`)}
                >
                  <div className="relative overflow-hidden rounded-2xl mb-4">
                    <img
                      src={post.image}
                      alt={post.title}
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
                  <p className={`text-sm leading-relaxed mb-4 transition-colors duration-300 ${
                    isDark ? 'text-white/80' : 'text-gray-700'
                  }`}>
                    {post.excerpt}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
