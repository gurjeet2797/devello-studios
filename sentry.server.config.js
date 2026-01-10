import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out non-critical server errors
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message) {
        // Filter out known non-critical errors
        if (error.message.includes('ECONNRESET')) {
          return null;
        }
        if (error.message.includes('ENOTFOUND')) {
          return null;
        }
        if (error.message.includes('ETIMEDOUT')) {
          return null;
        }
      }
    }
    return event;
  },

  // Ignore specific errors
  ignoreErrors: [
    'ECONNRESET',
    'ENOTFOUND', 
    'ETIMEDOUT',
    'ECONNREFUSED'
  ]
});
