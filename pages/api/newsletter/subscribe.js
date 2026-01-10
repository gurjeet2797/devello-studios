import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Use direct Supabase client creation for API routes
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Supabase environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseKey?.length || 0
    });
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables:', {
        url: supabaseUrl ? 'Set' : 'Missing',
        key: supabaseKey ? 'Set' : 'Missing'
      });
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    
    // Try to insert into database first
    
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert([
        { 
          email: email.toLowerCase().trim(),
          subscribed_at: new Date().toISOString(),
          status: 'active'
        }
      ])
      .select();

    if (error) {
      console.error('Newsletter API - Database storage failed:', error.message);
      
      // If it's a permission error, fall back to logging
      if (error.message.includes('permission denied')) {
        console.log('Newsletter subscription (fallback):', {
          email: email.toLowerCase().trim(),
          timestamp: new Date().toISOString()
        });
        
        return res.status(200).json({ 
          success: true, 
          message: 'Successfully subscribed to newsletter! (Note: Database storage not yet configured)' 
        });
      }
      
      // Check if it's a duplicate email error
      if (error.code === '23505') {
        return res.status(200).json({ 
          success: true, 
          message: 'Email already subscribed to newsletter' 
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to subscribe to newsletter',
        details: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Successfully subscribed to newsletter!' 
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
