import { google } from 'googleapis';
import { createSupabaseServerClient } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state } = req.query;

  if (!code || !state) {
    return res.redirect('/partners?error=missing_params');
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/calendar/callback`
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // SECURITY: Use server client (service role key) to store tokens
    // getSupabase() returns null on server-side, so we must use createSupabaseServerClient()
    try {
      const supabase = createSupabaseServerClient();
      
      // Store refresh token and access token for the user
      // Table: google_calendar_tokens with columns: user_id, refresh_token, access_token, expires_at
      const { error: upsertError } = await supabase
        .from('google_calendar_tokens')
        .upsert({
          user_id: state,
          refresh_token: tokens.refresh_token,
          access_token: tokens.access_token,
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        console.error('❌ [CALENDAR_OAUTH] Failed to store tokens:', upsertError);
        return res.redirect('/partners?error=token_storage_failed');
      }

      console.log('✅ [CALENDAR_OAUTH] Tokens stored successfully for user:', state);
    } catch (storageError) {
      console.error('❌ [CALENDAR_OAUTH] Error storing tokens:', storageError);
      return res.redirect('/partners?error=token_storage_failed');
    }

    return res.redirect('/partners?calendar_synced=true');
  } catch (error) {
    console.error('❌ [CALENDAR_OAUTH] Error in OAuth callback:', error);
    return res.redirect('/partners?error=oauth_failed');
  }
}

