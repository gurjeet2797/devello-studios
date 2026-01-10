// Test endpoint for monthly reset functionality
// Access at: /api/test-monthly-reset

import { UploadAllowanceService } from '../../lib/uploadAllowanceService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get a test user ID (you'll need to replace this with an actual user ID)
    const testUserId = req.query.userId;
    
    if (!testUserId) {
      return res.status(400).json({ 
        error: 'Please provide a userId query parameter',
        example: '/api/test-monthly-reset?userId=your-user-id'
      });
    }

    console.log('🧪 Testing monthly reset for user:', testUserId);

    // Get user allowance (this will trigger monthly reset if needed)
    const allowance = await UploadAllowanceService.getUserAllowance(testUserId);
    
    console.log('📊 User allowance:', allowance);

    res.status(200).json({
      success: true,
      message: 'Monthly reset test completed',
      allowance: {
        userId: allowance.userId,
        planType: allowance.planType,
        subscriptionStatus: allowance.subscriptionStatus,
        baseLimit: allowance.baseLimit,
        baseUsed: allowance.baseUsed,
        remaining: allowance.remaining,
        lastReset: allowance.lastReset || 'Not set'
      },
      breakdown: allowance.breakdown
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    res.status(500).json({ 
      error: 'Test failed', 
      message: error.message,
      stack: error.stack
    });
  }
}
