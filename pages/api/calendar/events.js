import { google } from 'googleapis';
import { getSupabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not initialized' });
    }

    // Verify the token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get stored tokens from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('refresh_token, access_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData || !tokenData.refresh_token) {
      return res.status(401).json({ error: 'Calendar not connected. Please connect your Google Calendar.' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/calendar/callback`
    );

    // Check if access token is expired and refresh if needed
    const now = new Date();
    const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at) : null;
    
    if (expiresAt && expiresAt <= now) {
      // Token expired, refresh it
      oauth2Client.setCredentials({
        refresh_token: tokenData.refresh_token
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update stored tokens
      await supabase
        .from('google_calendar_tokens')
        .update({
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      oauth2Client.setCredentials(credentials);
    } else {
      oauth2Client.setCredentials({
        refresh_token: tokenData.refresh_token,
        access_token: tokenData.access_token
      });
    }

    // Get date range from query params (default to current month)
    const { startDate, endDate } = req.query;
    const timeMin = startDate || new Date().toISOString();
    const timeMax = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch calendar events
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = (response.data.items || []).map(event => ({
      id: event.id,
      summary: event.summary || 'No title',
      description: event.description || '',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || '',
      htmlLink: event.htmlLink || '',
      attendees: event.attendees || []
    }));

    return res.status(200).json({ events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    
    if (error.code === 401) {
      return res.status(401).json({ error: 'Calendar access revoked. Please reconnect your Google Calendar.' });
    }
    
    return res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
}

