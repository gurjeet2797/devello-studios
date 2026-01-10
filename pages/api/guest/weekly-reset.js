import { GuestSessionService } from '../../../lib/guestSessionService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 [GUEST_RESET] Starting weekly reset...');

    const resetCount = await GuestSessionService.resetWeeklyLimits();

    console.log(`✅ [GUEST_RESET] Weekly reset completed: ${resetCount} sessions reset`);

    return res.status(200).json({
      success: true,
      message: `Weekly reset completed: ${resetCount} sessions reset`,
      resetCount
    });
  } catch (error) {
    console.error('❌ [GUEST_RESET] Error during weekly reset:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
