import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTheme } from '../Layout';
import CollectionDetailModal from './CollectionDetailModal';

// Product images by category
const getCollectionImage = (category) => {
  const images = {
    'millwork': 'https://static.wixstatic.com/media/c6bfe7_02e6fc33ca1e4a42bdc18f557fe4572a~mv2.png',
    'windows-doors': 'https://static.wixstatic.com/media/c6bfe7_340f3a0a8afe49938562711c6c0687a2~mv2.jpg',
    'glass-mirrors': 'https://static.wixstatic.com/media/c6bfe7_54504bab9dbb472da2334dea0bb012dc~mv2.jpg',
  };
  return images[category] || images['millwork'];
};

export default function FeaturedCollections({ hideTitle = false }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Reduce padding on store page
  const isStorePage = router?.pathname === '/custom';
  const topPadding = isStorePage ? 'pt-4 md:pt-6' : 'pt-8 md:pt-12';

  const collections = [
    {
      id: 'windows-doors',
      title: 'Windows & Doors',
      description: 'Energy-efficient windows and doors',
      image: getCollectionImage('windows-doors'),
      category: 'windows-doors' // Maps to 'windows' and 'doors' in database
    },
    {
      id: 'millwork',
      title: 'Custom Millwork',
      description: 'Handcrafted custom millwork and woodworking',
      image: getCollectionImage('millwork'),
      category: 'millwork' // Maps to 'custom' and 'hardware' in database
    },
    {
      id: 'glass-mirrors',
      title: 'Glass & Mirrors',
      description: 'Custom glass and mirror fabrication',
      image: getCollectionImage('glass-mirrors'),
      category: 'glass-mirrors' // Maps to 'glass' and 'mirrors' in database
    }
  ];

  const handleCollectionClick = (collection) => {
    setSelectedCollection(collection);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedCollection(null);
    }, 300);
  };

  return (
    <section 
      className={`${topPadding} pb-8 md:pb-12 ${isDark ? 'bg-black' : ''}`} 
      style={{ 
        position: 'relative', 
        zIndex: 0, 
        backgroundColor: isDark ? '#000000' : '#ffffff',
        backgroundImage: 'none',
        backgroundAttachment: 'fixed' 
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-20">
        {!hideTitle && (
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-light mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className="font-semibold">Signature</span> Collections
            </h2>
            <p className={`text-sm max-w-lg mx-auto mt-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              Envisioned by our clients, brought to life by Devello artisans
            </p>
          </div>
        )}

        <div 
          className="columns-1 md:columns-2"
          style={{ columnGap: '2rem' }}
        >
          {collections.map((collection, index) => (
            <div
              key={collection.id}
              onClick={() => handleCollectionClick(collection)}
              className="relative overflow-hidden group cursor-pointer rounded-3xl mb-8 break-inside-avoid"
            >
              <div className="relative w-full">
                <Image
                  src={collection.image}
                  alt={collection.title}
                  width={2400}
                  height={1600}
                  className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300 rounded-3xl"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ 
                    height: 'auto',
                    display: 'block'
                  }}
                />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-3xl pointer-events-none" />
              
              <div className="absolute bottom-8 left-8 right-8 pointer-events-none">
                <div 
                  className="about-devello-glass px-4 py-2 rounded-full inline-block"
                  style={{
                    backgroundColor: collection.id === 'windows-doors'
                      ? 'rgba(59, 130, 246, 0.3)'
                      : collection.id === 'millwork'
                      ? 'rgba(146, 64, 14, 0.3)'
                      : collection.id === 'glass-mirrors'
                      ? 'rgba(251, 191, 36, 0.3)'
                      : 'rgba(255, 255, 255, 0.1)',
                    borderColor: collection.id === 'windows-doors'
                      ? 'rgba(96, 165, 250, 0.4)'
                      : collection.id === 'millwork'
                      ? 'rgba(180, 83, 9, 0.4)'
                      : collection.id === 'glass-mirrors'
                      ? 'rgba(253, 224, 71, 0.4)'
                      : 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(12px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                  }}
                >
                  <h3 className="text-white text-base md:text-lg font-light">
                    {collection.title}
                  </h3>
                </div>
              </div>

              {/* Learn More button */}
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <button className="about-devello-glass px-5 py-2.5 rounded-full text-sm uppercase tracking-widest !text-white border border-white/30" style={{ color: 'white' }}>
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collection Detail Modal */}
      <CollectionDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        collection={selectedCollection}
      />
    </section>
  );
}
