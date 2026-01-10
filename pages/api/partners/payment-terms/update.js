import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import { UserService } from '../../../../lib/userService';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
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
      defaultPaymentType,
      depositPercentage,
      netDays,
      allowCustomTerms,
    } = req.body;

    // Validate payment type
    const validPaymentTypes = ['full_upfront', 'deposit_delivery', 'net_15', 'net_30', 'net_60'];
    if (defaultPaymentType && !validPaymentTypes.includes(defaultPaymentType)) {
      return res.status(400).json({ error: 'Invalid payment type' });
    }

    // Validate deposit percentage
    if (depositPercentage !== undefined && (depositPercentage < 0 || depositPercentage > 100)) {
      return res.status(400).json({ error: 'Deposit percentage must be between 0 and 100' });
    }

    // Validate net days
    if (netDays !== undefined && ![15, 30, 60].includes(netDays)) {
      return res.status(400).json({ error: 'Net days must be 15, 30, or 60' });
    }

    // Update or create payment terms
    const existingTerms = await prisma.partnerPaymentTerms.findUnique({
      where: { partner_id: partner.id },
    });

    let paymentTerms;
    if (existingTerms) {
      paymentTerms = await prisma.partnerPaymentTerms.update({
        where: { partner_id: partner.id },
        data: {
          default_payment_type: defaultPaymentType || existingTerms.default_payment_type,
          deposit_percentage: depositPercentage !== undefined ? depositPercentage : existingTerms.deposit_percentage,
          net_days: netDays !== undefined ? netDays : existingTerms.net_days,
          allow_custom_terms: allowCustomTerms !== undefined ? allowCustomTerms : existingTerms.allow_custom_terms,
        },
      });
    } else {
      paymentTerms = await prisma.partnerPaymentTerms.create({
        data: {
          partner_id: partner.id,
          default_payment_type: defaultPaymentType || 'full_upfront',
          deposit_percentage: depositPercentage,
          net_days: netDays,
          allow_custom_terms: allowCustomTerms || false,
        },
      });
    }

    return res.status(200).json({
      success: true,
      paymentTerms,
    });
  } catch (error) {
    console.error('Error updating payment terms:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

