// Supabase Edge Function for Monthly Reset
// Deploy with: supabase functions deploy monthly-reset

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MonthlyResetResult {
  success: boolean;
  userProfilesReset: number;
  purchasesReset: number;
  message: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔄 Starting monthly reset process...')

    // 1. Reset user profiles
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .update({
        upload_count: 0,
        last_monthly_reset: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all profiles
      .select('id')

    if (profileError) {
      throw new Error(`Profile reset failed: ${profileError.message}`)
    }

    // 2. Reset one-time purchase credits (they don't carry over to next month)
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('one_time_purchases')
      .update({ 
        uploads_granted: 0,
        uploads_used: 0
      })
      .eq('status', 'completed')
      .select('id')

    if (purchaseError) {
      throw new Error(`Purchase reset failed: ${purchaseError.message}`)
    }

    const result: MonthlyResetResult = {
      success: true,
      userProfilesReset: profileData?.length || 0,
      purchasesReset: purchaseData?.length || 0,
      message: 'Monthly reset completed successfully',
      timestamp: new Date().toISOString()
    }

    console.log('✅ Monthly reset completed:', result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Monthly reset failed:', error)
    
    const errorResult = {
      success: false,
      userProfilesReset: 0,
      purchasesReset: 0,
      message: `Monthly reset failed: ${error.message}`,
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(errorResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
