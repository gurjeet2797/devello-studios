import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import { UserService } from '../../../../lib/userService';
import { StripeConnectService } from '../../../../lib/stripeConnectService';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get user
    const supabase = createSupabaseAuthClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user and partner
    const prismaUser = await UserService.getOrCreateUser(user.id, user.email);
    const partner = await prisma.partner.findUnique({
      where: { user_id: prismaUser.id },
    });

    if (!partner) {
      return res.status(403).json({ error: 'User is not a partner' });
    }

    // Check if account already exists
    const existingBankAccount = await prisma.partnerBankAccount.findUnique({
      where: { partner_id: partner.id },
    });

    let accountId = existingBankAccount?.stripe_account_id;

    // Create Stripe Connect account if it doesn't exist
    if (!accountId) {
      const account = await StripeConnectService.createConnectAccount(
        partner.id,
        prismaUser.email
      );
      accountId = account.id;

      // Save account ID
      if (existingBankAccount) {
        await prisma.partnerBankAccount.update({
          where: { partner_id: partner.id },
          data: { stripe_account_id: accountId },
        });
      }
    }

    // Generate onboarding link
    const returnUrl = `${req.headers.origin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/partners?onboarded=true`;
    const refreshUrl = `${req.headers.origin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/partners?onboarded=refresh`;

    const accountLink = await StripeConnectService.createOnboardingLink(
      accountId,
      returnUrl,
      refreshUrl
    );

    return res.status(200).json({
      success: true,
      onboardingUrl: accountLink.url,
      accountId: accountId,
    });
  } catch (error) {
    console.error('Error creating onboarding link:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

