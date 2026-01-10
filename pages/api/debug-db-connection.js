import prisma from '../../lib/prisma';
import { requireAdmin } from '../../lib/adminAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SECURITY: Only allow in development, or require admin auth in production
  if (process.env.NODE_ENV === 'production') {
    // In production, this endpoint is completely disabled for security
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    // Test 1: Check environment variables - never expose DATABASE_URL
    const envCheck = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
      hasPostgresHost: !!process.env.POSTGRES_HOST,
      nodeEnv: process.env.NODE_ENV,
      // SECURITY: Never expose any part of DATABASE_URL (could contain password)
    };
    
    // Test 2: Check Prisma client initialization
    const prismaCheck = {
      prismaExists: !!prisma,
      prismaType: typeof prisma,
      // SECURITY: Don't expose all methods, just confirm it exists
    };
    
    if (!prisma) {
      return res.status(500).json({
        error: 'Prisma client not initialized',
        envCheck,
        prismaCheck
      });
    }
    
    // Test 3: Simple database query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    // SECURITY: Don't expose table schema in production
    // Only test connection, not schema details
    const userCount = await prisma.user.count();
    
    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      envCheck,
      prismaCheck,
      tests: {
        simpleQuery: 'success',
        userCount: userCount
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // SECURITY: Don't expose detailed error info in production
    return res.status(500).json({
      error: 'Database connection failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        nodeEnv: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    });
  }
}

// SECURITY: In production, require admin auth. In development, allow access.
export default process.env.NODE_ENV === 'production' 
  ? requireAdmin(handler)
  : handler;
