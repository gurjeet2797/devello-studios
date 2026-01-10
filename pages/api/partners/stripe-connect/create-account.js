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

    const {
      accountHolderName,
      accountHolderType,
      routingNumber,
      accountNumber,
      bankName,
      accountType,
    } = req.body;

    // Validate required fields
    if (!accountHolderName || !accountHolderType || !routingNumber || !accountNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create Stripe Connect account
    const account = await StripeConnectService.createConnectAccount(
      partner.id,
      prismaUser.email
    );

    // Save bank account info
    const bankAccount = await StripeConnectService.saveBankAccount(
      partner.id,
      {
        accountHolderName,
        accountHolderType,
        routingNumber,
        accountNumber,
        bankName,
        accountType,
      },
      account.id
    );

    return res.status(200).json({
      success: true,
      accountId: account.id,
      bankAccount: {
        id: bankAccount.id,
        verificationStatus: bankAccount.verification_status,
      },
    });
  } catch (error) {
    console.error('Error creating Connect account:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

