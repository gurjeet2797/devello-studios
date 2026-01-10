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
        if (error.message.includes('Non-Error promise rejection captured')) {
          return null;
        }
        if (error.message.includes('Loading chunk')) {
          return null;
        }
      }
    }
    return event;
  },

  // Ignore specific errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'Loading chunk',
    'ChunkLoadError',
    'Network request failed'
  ],

  // Set user context
  beforeSend(event) {
    // Add user context if available
    if (typeof window !== 'undefined' && window.localStorage) {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          event.user = {
            id: userData.id,
            email: userData.email
          };
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
    return event;
  }
});
