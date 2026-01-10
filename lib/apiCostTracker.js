import prisma from './prisma';

class APICostTracker {
  constructor() {
    // Initialize with Prisma for better performance
  }

  // Track Google Gemini API costs with real-time calculation
  async trackGeminiCost(inputTokens, outputTokens, model = 'gemini-pro', requestData = {}) {
    try {
      const cost = this.calculateGeminiCost(inputTokens, outputTokens, model);
      
      await prisma.apiCost.create({
        data: {
          service: 'google_gemini',
          cost: cost,
          request_data: {
            model,
            inputTokens,
            outputTokens,
            ...requestData
          },
          timestamp: new Date(),
        },
      });
      
      console.log(`💰 [GEMINI] ${model}: $${cost.toFixed(6)} (${inputTokens} in, ${outputTokens} out tokens)`);
      return cost;
    } catch (error) {
      console.error('Error tracking Gemini cost:', error);
      return 0;
    }
  }

  // Track Replicate API costs with real-time calculation
  async trackReplicateCost(predictionId, model, duration, status, requestData = {}) {
    try {
      const cost = this.calculateReplicateCost(model, duration);
      
      await prisma.apiCost.create({
        data: {
          service: 'replicate',
          cost: cost,
          request_data: {
            predictionId,
            model,
            duration,
            status,
            ...requestData
          },
          timestamp: new Date(),
        },
      });
      
      console.log(`💰 [REPLICATE] ${model}: $${cost.toFixed(6)} (${duration}s)`);
      return cost;
    } catch (error) {
      console.error('Error tracking Replicate cost:', error);
      return 0;
    }
  }

  // Track Supabase costs
  async trackSupabaseCost(operation, dataSize, requestData = {}) {
    try {
      const cost = this.calculateSupabaseCost(operation, dataSize);
      
      await prisma.apiCost.create({
        data: {
          service: 'supabase',
          cost: cost,
          request_data: { operation, dataSize, ...requestData },
          timestamp: new Date(),
        },
      });
      
      console.log(`💰 [SUPABASE] ${operation}: $${cost.toFixed(6)}`);
      return cost;
    } catch (error) {
      console.error('Error tracking Supabase cost:', error);
      return 0;
    }
  }

  // Track Vercel costs
  async trackVercelCost(functionName, executionTime, memoryMB = 1024, requestData = {}) {
    try {
      const cost = this.calculateVercelCost(functionName, executionTime, memoryMB);
      
      await prisma.apiCost.create({
        data: {
          service: 'vercel',
          cost: cost,
          request_data: { functionName, executionTime, memoryMB, ...requestData },
          timestamp: new Date(),
        },
      });
      
      console.log(`💰 [VERCEL] ${functionName}: $${cost.toFixed(6)} (${executionTime}ms)`);
      return cost;
    } catch (error) {
      console.error('Error tracking Vercel cost:', error);
      return 0;
    }
  }

  // Calculate Google Gemini costs based on actual token usage
  calculateGeminiCost(inputTokens, outputTokens, model = 'gemini-pro') {
    // Updated Gemini pricing (2024)
    const pricing = {
      'gemini-pro': { input: 0.0005, output: 0.0015 }, // per 1K tokens
      'gemini-pro-vision': { input: 0.0005, output: 0.0015 },
      'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
      'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
      'gemini-2.5-flash': { input: 0.000075, output: 0.0003 }, // per 1K tokens - using flash pricing
      'gemini-2.5-flash-image': { input: 0.000075, output: 0.0003 }, // per 1K tokens - Nano Banana image generation model
      'nano-banana-pro': { input: 0.000075, output: 0.0003 } // per 1K tokens - using flash pricing as default
    };

    const rates = pricing[model] || pricing['gemini-pro'];
    const inputCost = (inputTokens / 1000) * rates.input;
    const outputCost = (outputTokens / 1000) * rates.output;
    
    return inputCost + outputCost;
  }

  // Calculate Replicate costs based on model and duration
  calculateReplicateCost(model, duration) {
    // Updated Replicate pricing (2024)
    const pricing = {
      'stability-ai/stable-diffusion': 0.0023, // per second
      'stability-ai/sdxl': 0.0046,
      'runwayml/stable-diffusion-v1-5': 0.0023,
      'tencentarc/photomaker': 0.0046,
      'black-forest-labs/flux-dev': 0.0046,
      'default': 0.0023
    };
    
    const rate = pricing[model] || pricing.default;
    return duration * rate;
  }

  // Calculate Supabase costs
  calculateSupabaseCost(operation, dataSize) {
    // Supabase pricing: $25/month for Pro plan
    // This is a simplified calculation
    const baseCost = 25 / 30 / 24 / 60 / 60; // per second
    const dataCost = (dataSize / 1024 / 1024) * 0.0001; // per MB
    
    return baseCost + dataCost;
  }

  // Calculate Vercel costs
  calculateVercelCost(functionName, executionTime, memoryMB = 1024) {
    // Vercel pricing: $0.0000166667 per GB-second
    const memoryGB = memoryMB / 1024;
    const executionSeconds = executionTime / 1000; // Convert ms to seconds
    const costPerGBSecond = 0.0000166667;
    
    return memoryGB * executionSeconds * costPerGBSecond;
  }

  // Get API costs for a date range
  async getCostsForPeriod(startDate, endDate) {
    try {
      const data = await prisma.apiCost.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
      return data;
    } catch (error) {
      console.error('Error fetching costs for period:', error);
      return [];
    }
  }

  // Get costs by service
  async getCostsByService(startDate, endDate) {
    try {
      const data = await prisma.apiCost.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          service: true,
          cost: true,
          timestamp: true
        }
      });

      // Group by service and sum costs
      const serviceCosts = data.reduce((acc, item) => {
        if (!acc[item.service]) {
          acc[item.service] = { total: 0, count: 0 };
        }
        acc[item.service].total += parseFloat(item.cost);
        acc[item.service].count += 1;
        return acc;
      }, {});

      return serviceCosts;
    } catch (error) {
      console.error('Error fetching costs by service:', error);
      return {};
    }
  }

  // Get daily costs for the last 30 days
  async getDailyCosts() {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const data = await prisma.apiCost.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          cost: true,
          timestamp: true
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      // Group by day
      const dailyCosts = data.reduce((acc, item) => {
        const date = new Date(item.timestamp).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += parseFloat(item.cost);
        return acc;
      }, {});

      return Object.entries(dailyCosts).map(([date, cost]) => ({
        date,
        cost
      }));
    } catch (error) {
      console.error('Error fetching daily costs:', error);
      return [];
    }
  }
}

export const apiCostTracker = new APICostTracker();
export default apiCostTracker;
