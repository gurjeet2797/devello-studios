const fs = require('fs');
const path = require('path');

// Production setup script for Devello Inc

// 1. Create production environment file
function createProductionEnv() {
  
  const envContent = `# Production Environment Variables
# Copy this file to .env.production and fill in your values

# Database
POSTGRES_PRISMA_URL="your_production_database_url"
POSTGRES_URL_NON_POOLING="your_production_database_url"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"

# Stripe
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

# Email (Optional)
SENDGRID_API_KEY="your_sendgrid_api_key"
FROM_EMAIL="noreply@your-domain.com"

# Monitoring (Optional)
SENTRY_DSN="your_sentry_dsn"
VERCEL_ANALYTICS_ID="your_vercel_analytics_id"

# Security
ENCRYPTION_KEY="your_encryption_key"
JWT_SECRET="your_jwt_secret"

# Rate Limiting
REDIS_URL="your_redis_url"

# CDN (Optional)
CDN_URL="https://your-cdn.com"
`;

  fs.writeFileSync(path.join(__dirname, '..', '.env.production.example'), envContent);
}

// 2. Create production Next.js config
function createProductionNextConfig() {
  
  const nextConfigContent = `const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com https://*.supabase.co; frame-src https://js.stripe.com;",
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    domains: ['your-cdn.com', 'your-supabase-storage.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // Bundle analyzer (only in development)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: true,
        })
      );
      return config;
    },
  }),

  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },

  // Output configuration
  output: 'standalone',
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

// Sentry configuration (optional)
const sentryWebpackPluginOptions = {
  org: 'your-sentry-org',
  project: 'devello-studio',
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

module.exports = process.env.SENTRY_DSN 
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
`;

  fs.writeFileSync(path.join(__dirname, '..', 'next.config.production.js'), nextConfigContent);
}

// 3. Create production Docker configuration
function createDockerConfig() {
  
  const dockerfileContent = `FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
`;

  const dockerComposeContent = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - POSTGRES_PRISMA_URL=\${POSTGRES_PRISMA_URL}
      - NEXT_PUBLIC_SUPABASE_URL=\${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=\${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=\${SUPABASE_SERVICE_ROLE_KEY}
      - STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY}
      - STRIPE_PUBLISHABLE_KEY=\${STRIPE_PUBLISHABLE_KEY}
      - STRIPE_WEBHOOK_SECRET=\${STRIPE_WEBHOOK_SECRET}
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  redis_data:
`;

  fs.writeFileSync(path.join(__dirname, '..', 'Dockerfile'), dockerfileContent);
  fs.writeFileSync(path.join(__dirname, '..', 'docker-compose.yml'), dockerComposeContent);
}

// 4. Create monitoring configuration
function createMonitoringConfig() {
  
  const sentryConfigContent = `// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out non-error events
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message) {
        // Filter out known non-critical errors
        if (error.message.includes('ResizeObserver loop limit exceeded')) {
          return null;
        }
      }
    }
    return event;
  },
});
`;

  const vercelConfigContent = `{
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ]
}`;

  fs.writeFileSync(path.join(__dirname, '..', 'sentry.client.config.js'), sentryConfigContent);
  fs.writeFileSync(path.join(__dirname, '..', 'vercel.json'), vercelConfigContent);
}

// 5. Create production scripts
function createProductionScripts() {
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add production scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    'build:prod': 'NODE_ENV=production next build',
    'start:prod': 'NODE_ENV=production next start',
    'analyze': 'ANALYZE=true npm run build',
    'audit:security': 'node scripts/security-audit.js',
    'audit:performance': 'node scripts/performance-audit.js',
    'db:migrate:prod': 'NODE_ENV=production npx prisma migrate deploy',
    'db:seed:prod': 'NODE_ENV=production node scripts/seed-production.js',
    'health:check': 'curl -f http://localhost:3000/api/health || exit 1'
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

// 6. Create health check endpoint
function createHealthCheck() {
  
  const healthCheckContent = `export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    // Add database health check
    // const dbHealth = await checkDatabaseConnection();
    // healthCheck.database = dbHealth;
    
    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      ...healthCheck,
      message: 'Service Unavailable',
      error: error.message
    });
  }
}`;

  const healthDir = path.join(__dirname, '..', 'pages', 'api');
  if (!fs.existsSync(healthDir)) {
    fs.mkdirSync(healthDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(healthDir, 'health.js'), healthCheckContent);
}

// Run all setup functions
createProductionEnv();
createProductionNextConfig();
createDockerConfig();
createMonitoringConfig();
createProductionScripts();
createHealthCheck();


