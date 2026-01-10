/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // IMPORTANT: In production on Vercel, environment variables come from Vercel's
  // environment variable system, NOT from .env files. Next.js will automatically
  // use process.env values which Vercel injects at build/runtime.
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      // Block access to .env files
      {
        source: '/.env',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain'
          }
        ]
      },
      {
        source: '/.env.production',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain'
          }
        ]
      },
      {
        source: '/.env.local',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain'
          }
        ]
      },
      // Ensure BingSiteAuth.xml is served with correct content type
      {
        source: '/BingSiteAuth.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml; charset=utf-8'
          }
        ]
      }
    ];
  },

  // Image optimization
  images: {
    domains: ['images.weserv.nl', 'replicate.delivery', 'static.wixstatic.com', 'images.unsplash.com', 'ui-avatars.com', 'via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    // Allow unoptimized images for external sources that might have issues
    unoptimized: false
  },

  // Disable static optimization for problematic pages
  trailingSlash: false,
  
  // Block .env file access via rewrites
  async rewrites() {
    return {
      beforeFiles: [
        // Block access to .env files - return 404
        {
          source: '/.env',
          destination: '/api/blocked'
        },
        {
          source: '/.env.production',
          destination: '/api/blocked'
        },
        {
          source: '/.env.local',
          destination: '/api/blocked'
        },
        {
          source: '/.env.development',
          destination: '/api/blocked'
        },
        // Route robots.txt and sitemap.xml to dynamic API routes
        {
          source: '/robots.txt',
          destination: '/api/robots.txt'
        },
        {
          source: '/sitemap.xml',
          destination: '/api/sitemap.xml'
        }
      ]
    };
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.minimize = true;
    }
    
    // Ensure emailService and sharp are only used on server side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // Exclude sharp and canvas from client bundle (they're Node.js native modules)
      // Mark as external so webpack doesn't try to bundle them
      config.externals = config.externals || [];
      if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = [
          originalExternals,
          ({ request }, callback) => {
            if (/^sharp$/.test(request) || /sharp/.test(request) ||
                /^canvas$/.test(request) || /canvas/.test(request)) {
              return callback(null, 'commonjs ' + request);
            }
            callback();
          }
        ];
      } else {
        config.externals.push(({ request }, callback) => {
          if (/^sharp$/.test(request) || /sharp/.test(request) ||
              /^canvas$/.test(request) || /canvas/.test(request)) {
            return callback(null, 'commonjs ' + request);
          }
          callback();
        });
      }
      
      // Also use IgnorePlugin as backup
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.IgnorePlugin({
          checkResource(resource) {
            return /^sharp$/.test(resource) || /sharp.*\.node$/.test(resource) ||
                   /^canvas$/.test(resource) || /canvas.*\.node$/.test(resource);
          }
        })
      );
    }
    
    // Add resolve alias for lib directory
    const path = require('path');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@lib': path.resolve(__dirname, 'lib'),
    };
    
    return config;
  }
};

module.exports = nextConfig;
