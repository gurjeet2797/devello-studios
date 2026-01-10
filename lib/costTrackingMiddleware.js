import { apiCostTracker } from './apiCostTracker';

/**
 * Middleware to automatically track Google Gemini API costs
 */
export function trackGeminiCosts() {
  return async (req, res, next) => {
    const originalSend = res.send;
    const startTime = Date.now();

    res.send = function(data) {
      try {
        // Extract token usage from response
        if (data && typeof data === 'string') {
          const parsed = JSON.parse(data);
          if (parsed.usage) {
            const { prompt_tokens, completion_tokens, model } = parsed.usage;
            if (prompt_tokens && completion_tokens) {
              // Track cost asynchronously
              apiCostTracker.trackGeminiCost(
                prompt_tokens,
                completion_tokens,
                model || 'gemini-pro',
                {
                  requestId: req.headers['x-request-id'],
                  endpoint: req.path,
                  method: req.method
                }
              ).catch(console.error);
            }
          }
        }
      } catch (error) {
        console.error('Error tracking Gemini costs:', error);
      }
      
      return originalSend.call(this, data);
    };

    if (next) next();
  };
}

/**
 * Middleware to automatically track Replicate API costs
 */
export function trackReplicateCosts() {
  return async (req, res, next) => {
    const originalSend = res.send;
    const startTime = Date.now();

    res.send = function(data) {
      try {
        // Extract prediction data from response
        if (data && typeof data === 'string') {
          const parsed = JSON.parse(data);
          if (parsed.id && parsed.status) {
            const duration = parsed.metrics?.predict_time || 0;
            const model = parsed.model || req.body?.model;
            
            if (duration > 0 && model) {
              // Track cost asynchronously
              apiCostTracker.trackReplicateCost(
                parsed.id,
                model,
                duration,
                parsed.status,
                {
                  requestId: req.headers['x-request-id'],
                  endpoint: req.path,
                  method: req.method
                }
              ).catch(console.error);
            }
          }
        }
      } catch (error) {
        console.error('Error tracking Replicate costs:', error);
      }
      
      return originalSend.call(this, data);
    };

    if (next) next();
  };
}

/**
 * Middleware to track Supabase operation costs
 */
export function trackSupabaseCosts() {
  return async (req, res, next) => {
    const originalSend = res.send;
    const startTime = Date.now();

    res.send = function(data) {
      try {
        // Calculate data size from request/response
        const requestSize = JSON.stringify(req.body || {}).length;
        const responseSize = typeof data === 'string' ? data.length : JSON.stringify(data).length;
        const totalSize = requestSize + responseSize;
        
        // Track cost for database operations
        if (req.path.includes('/api/') && totalSize > 0) {
          apiCostTracker.trackSupabaseCost(
            req.method,
            totalSize,
            {
              endpoint: req.path,
              requestSize,
              responseSize
            }
          ).catch(console.error);
        }
      } catch (error) {
        console.error('Error tracking Supabase costs:', error);
      }
      
      return originalSend.call(this, data);
    };

    if (next) next();
  };
}

/**
 * Middleware to track Vercel function execution costs
 */
export function trackVercelCosts() {
  return async (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function(data) {
      try {
        const executionTime = Date.now() - startTime;
        const memoryMB = process.env.VERCEL_FUNCTION_MEMORY || 1024;
        
        // Track cost for API routes
        if (req.path.includes('/api/')) {
          apiCostTracker.trackVercelCost(
            req.path,
            executionTime,
            memoryMB,
            {
              method: req.method,
              userAgent: req.headers['user-agent']
            }
          ).catch(console.error);
        }
      } catch (error) {
        console.error('Error tracking Vercel costs:', error);
      }
      
      return originalSend.call(this, data);
    };

    if (next) next();
  };
}

/**
 * Universal cost tracking middleware
 */
export function trackAllCosts() {
  return async (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function(data) {
      try {
        const executionTime = Date.now() - startTime;
        
        // Track based on endpoint
        if (req.path.includes('/api/gemini') || req.path.includes('/api/ai')) {
          // This will be handled by specific Gemini middleware
        } else if (req.path.includes('/api/replicate')) {
          // This will be handled by specific Replicate middleware
        } else if (req.path.includes('/api/')) {
          // Track as Vercel function cost
          const memoryMB = process.env.VERCEL_FUNCTION_MEMORY || 1024;
          apiCostTracker.trackVercelCost(
            req.path,
            executionTime,
            memoryMB,
            {
              method: req.method,
              userAgent: req.headers['user-agent']
            }
          ).catch(console.error);
        }
      } catch (error) {
        console.error('Error tracking costs:', error);
      }
      
      return originalSend.call(this, data);
    };

    if (next) next();
  };
}
