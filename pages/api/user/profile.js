import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import { UserService } from '../../../lib/userService';
import { UploadAllowanceService } from '../../../lib/uploadAllowanceService';
import { StripeSubscriptionService } from '../../../lib/stripeSubscriptionService';
import prisma from '../../../lib/prisma';
import { safeLog } from '../../../lib/config';

const log = (level, message, data = {}) => safeLog(level, message, data);

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // SECURITY: Validate token format
    if (!token || token.length < 10) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    log('info', '[PROFILE_API_DEBUG] Profile request', {
      method: req.method,
      hasToken: !!token,
      tokenLength: token.length,
      tokenStart: token.substring(0, 10) + '...',
      env: {
        hasPostgresHost: !!process.env.POSTGRES_HOST,
        hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
        hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasNextPublicAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        // SECURITY: Never log actual URLs or secrets
        nodeEnv: process.env.NODE_ENV
      }
    });
    
    // Create Supabase client for user token verification (uses anon key)
    // Don't pass token to client - pass it directly to getUser() like other routes
    let supabase;
    try {
      supabase = createSupabaseAuthClient();
      log('info', '✅ [PROFILE] Supabase auth client created successfully');
    } catch (supabaseError) {
      log('error', '❌ [PROFILE] Failed to create Supabase client', {
        error: supabaseError.message,
        env: {
          hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          // SECURITY: Never log actual URLs
        }
      });
      return res.status(500).json({ 
        error: 'Supabase configuration error',
        details: process.env.NODE_ENV === 'development' ? supabaseError.message : undefined
      });
    }
    
    // Verify the token and get user (same pattern as adminAuth.js)
    log('info', '🔍 [PROFILE] Verifying token with Supabase (anon key)...');
    
    let user;
    let authError;
    
    try {
      // Use getUser(token) directly - this is the correct way to verify tokens server-side
      const { data: { user: verifiedUser }, error: getUserError } = await supabase.auth.getUser(token);
      user = verifiedUser;
      authError = getUserError;
    } catch (err) {
      log('error', '❌ [PROFILE] Exception during auth', { error: err?.message });
      authError = err;
    }
    
    if (authError || !user) {
      // Only log error details in development to reduce console spam
      if (process.env.NODE_ENV === 'development') {
        log('error', '❌ [PROFILE] Auth error', {
          error: authError?.message,
          errorCode: authError?.code,
          errorStatus: authError?.status,
          hasUser: !!user,
          tokenLength: token.length,
          tokenStart: token.substring(0, 20) + '...'
        });
      }
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'AUTH_ERROR',
        details: process.env.NODE_ENV === 'development' ? authError?.message : undefined
      });
    }
    
    log('info', '✅ [PROFILE] User authenticated', {
      userId: user.id,
      email: user.email,
      hasMetadata: !!user.user_metadata
    });
    

    if (req.method === 'GET') {
      // Test database connection first
      try {
        await prisma.$queryRaw`SELECT 1`;
        log('info', '✅ [PROFILE] Database connection successful');
      } catch (dbError) {
        log('error', '❌ [PROFILE] Database connection failed', { error: dbError.message });
        return res.status(500).json({ 
          error: 'Database connection failed',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        });
      }
      
      // Get user profile
      const profile = await UserService.getOrCreateUser(user.id, user.email);
      
      // Extract name from Google profile if available
      
      // Check if we have Google profile data in user metadata
      if (user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.given_name || user.user_metadata?.family_name) {
        let firstName = '';
        let lastName = '';
        
        // Try different ways Google might provide the name
        if (user.user_metadata?.given_name && user.user_metadata?.family_name) {
          firstName = user.user_metadata.given_name;
          lastName = user.user_metadata.family_name;
        } else if (user.user_metadata?.full_name) {
          const fullName = user.user_metadata.full_name;
          const nameParts = fullName.split(' ');
          firstName = nameParts[0];
          lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        } else if (user.user_metadata?.name) {
          const fullName = user.user_metadata.name;
          const nameParts = fullName.split(' ');
          firstName = nameParts[0];
          lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        }
        
        
        // Check if profile names are empty or different
        const currentFirstName = profile.profile?.first_name || '';
        const currentLastName = profile.profile?.last_name || '';
        
        if (!currentFirstName || !currentLastName || 
            (firstName && firstName !== currentFirstName) || 
            (lastName && lastName !== currentLastName)) {
          
          // Update the profile directly in the database
          await prisma.userProfile.update({
            where: { user_id: profile.id },
            data: {
              first_name: firstName,
              last_name: lastName
            }
          });
          
          // Update the profile object for response
          profile.profile.first_name = firstName;
          profile.profile.last_name = lastName;
          
        }
      } else {
      }
      
      // Auto-sync with Stripe if user has subscription
      if (profile.subscription?.stripe_customer_id) {
        try {
          const syncResult = await StripeSubscriptionService.syncUserSubscription(profile);
          
          if (syncResult.needsUpdate && syncResult.subscription) {
            
            // Determine status, plan type, and upload limit based on cancellation
            const status = StripeSubscriptionService.getExpectedStatus(syncResult.subscription);
            let planType = StripeSubscriptionService.getPlanTypeFromPriceId(syncResult.subscription.items.data[0].price.id);
            let uploadLimit = StripeSubscriptionService.getUploadLimitFromPriceId(syncResult.subscription.items.data[0].price.id);
            
            // If subscription is canceled and NOT marked for cancellation at period end, reset to free tier
            // If subscription is marked for cancellation at period end, keep current plan and limits
            if (status === 'canceled' && !syncResult.subscription.cancel_at_period_end) {
              planType = 'free';
              uploadLimit = 5;
            } else if (status === 'canceled' && syncResult.subscription.cancel_at_period_end) {
              // Keep the current plan type and upload limit
              // planType and uploadLimit remain unchanged
            }

            // Update subscription with latest Stripe data
            await UserService.updateSubscription(profile.id, {
              stripe_subscription_id: syncResult.subscription.id,
              stripe_price_id: syncResult.subscription.items.data[0].price.id,
              status: status,
              plan_type: planType,
              current_period_start: new Date(syncResult.subscription.current_period_start * 1000),
              current_period_end: new Date(syncResult.subscription.current_period_end * 1000),
              upload_limit: uploadLimit
            });

            // Update profile upload limit
            await UserService.updateProfile(profile.id, {
              upload_limit: uploadLimit
            });

            
            // Refetch profile to get updated data
            const updatedProfile = await UserService.getOrCreateUser(user.id, user.email);
            profile.subscription = updatedProfile.subscription;
            profile.profile = updatedProfile.profile;
          }
        } catch (syncError) {
          console.error('⚠️ [PROFILE] Stripe sync failed, using cached data:', syncError.message);
          // Continue with cached data if sync fails
        }
      }
      
      // Get upload stats using the new service
      let uploadStats;
      try {
        console.log('🔍 [PROFILE] Getting upload stats for user:', profile.id);
        uploadStats = await UploadAllowanceService.getUploadStats(profile.id);
        console.log('✅ [PROFILE] Upload stats retrieved:', uploadStats);
      } catch (uploadError) {
        console.error('⚠️ [PROFILE] Upload stats failed, using fallback:', {
          error: uploadError.message,
          stack: uploadError.stack,
          code: uploadError.code
        });
        // Provide fallback upload stats
        uploadStats = {
          uploadCount: profile.profile?.upload_count || 0,
          uploadLimit: profile.profile?.upload_limit || 5,
          remaining: Math.max(0, (profile.profile?.upload_limit || 5) - (profile.profile?.upload_count || 0)),
          planType: profile.subscription?.plan_type || 'free',
          subscriptionStatus: profile.subscription?.status || 'inactive'
        };
      }
      
      // 🔍 DEBUG: Upload stats calculation
      console.log('🔍 [UPLOAD_STATS_CALCULATION] Profile data:', {
        userId: profile.id,
        userEmail: profile.email,
        profile: profile.profile ? {
          uploadCount: profile.profile.uploadCount,
          uploadLimit: profile.profile.uploadLimit
        } : null,
        subscription: profile.subscription ? {
          planType: profile.subscription.planType,
          status: profile.subscription.status,
          uploadLimit: profile.subscription.uploadLimit
        } : null,
        calculatedUploadStats: uploadStats ? {
          uploadCount: uploadStats.uploadCount,
          uploadLimit: uploadStats.uploadLimit,
          remaining: uploadStats.remaining,
          planType: uploadStats.planType,
          subscriptionStatus: uploadStats.subscriptionStatus
        } : null
      });
      
      // Combine profile and upload stats
      const response = {
        ...profile,
        uploadStats
      };
      
      console.log('✅ [PROFILE] Returning profile data:', {
        userId: profile.id,
        email: profile.email,
        hasUploadStats: !!uploadStats,
        uploadStatsKeys: uploadStats ? Object.keys(uploadStats) : [],
        uploadStatsData: uploadStats ? {
          uploadCount: uploadStats.uploadCount,
          uploadLimit: uploadStats.uploadLimit,
          remaining: uploadStats.remaining,
          planType: uploadStats.planType
        } : null
      });
      
      return res.status(200).json(response);
    } else if (req.method === 'PUT') {
      // Update user profile
      const { first_name, last_name, display_name, website, bio, upload_limit, upload_count } = req.body;
      
      // SECURITY: Input validation and sanitization
      const updates = {};
      if (first_name && typeof first_name === 'string' && first_name.length <= 100) {
        updates.first_name = first_name.trim();
      }
      if (last_name && typeof last_name === 'string' && last_name.length <= 100) {
        updates.last_name = last_name.trim();
      }
      if (display_name && typeof display_name === 'string' && display_name.length <= 100) {
        updates.display_name = display_name.trim();
      }
      if (website && typeof website === 'string' && website.length <= 255) {
        // Basic URL validation
        try {
          new URL(website);
          updates.website = website.trim();
        } catch {
          return res.status(400).json({ error: 'Invalid website URL' });
        }
      }
      if (bio && typeof bio === 'string' && bio.length <= 500) {
        updates.bio = bio.trim();
      }
      
      // TEMPORARY TESTING: Allow upload limit and count updates
      if (true) {
        if (upload_limit && typeof upload_limit === 'number' && upload_limit > 0 && upload_limit <= 1000) {
          updates.upload_limit = upload_limit;
        }
        if (upload_count !== undefined && typeof upload_count === 'number' && upload_count >= 0) {
          updates.upload_count = upload_count;
        }
      }
      
      const updatedProfile = await UserService.updateUser(user.id, updates);
      return res.status(200).json(updatedProfile);
    }
  } catch (error) {
    console.error('❌ [PROFILE] Profile API error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      env: {
        hasPostgresHost: !!process.env.POSTGRES_HOST,
        hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
        hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
    
    // SECURITY: Don't expose internal error details in production
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
