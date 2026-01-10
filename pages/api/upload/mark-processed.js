import { createSupabaseServerClient } from '../../../lib/supabaseClient';
import { UserService } from '../../../lib/userService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseServerClient();
    
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { uploadId, predictionId, uploadType } = req.body;

    if (!uploadId) {
      return res.status(400).json({ error: 'Upload ID is required' });
    }

    // Get or create user
    const userData = await UserService.getOrCreateUser(user.id, user.email);

    // Mark upload as processed and count towards limit
    const upload = await UserService.markUploadAsProcessed(uploadId, predictionId);

    // Get updated upload stats
    const uploadStats = await UserService.getUploadStats(userData.id);


    return res.status(200).json({
      success: true,
      upload,
      uploadStats
    });
  } catch (error) {
    console.error('Mark processed error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
