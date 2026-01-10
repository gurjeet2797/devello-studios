import Stripe from 'stripe';
import prisma from './prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export class StripeConnectService {
  /**
   * Create a Stripe Connect account for a partner
   */
  static async createConnectAccount(partnerId, email, country = 'US') {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country: country,
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          partner_id: partnerId,
        },
      });

      return account;
    } catch (error) {
      console.error('Error creating Stripe Connect account:', error);
      throw error;
    }
  }

  /**
   * Generate onboarding link for partner to complete Stripe Connect setup
   */
  static async createOnboardingLink(accountId, returnUrl, refreshUrl) {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      console.error('Error creating onboarding link:', error);
      throw error;
    }
  }

  /**
   * Get account status and details
   */
  static async getAccountStatus(accountId) {
    try {
      const account = await stripe.accounts.retrieve(accountId);
      return {
        id: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        email: account.email,
        country: account.country,
        type: account.type,
      };
    } catch (error) {
      console.error('Error retrieving account status:', error);
      throw error;
    }
  }

  /**
   * Create or update partner bank account record
   */
  static async saveBankAccount(partnerId, bankAccountData, stripeAccountId) {
    try {
      const existing = await prisma.partnerBankAccount.findUnique({
        where: { partner_id: partnerId },
      });

      if (existing) {
        return await prisma.partnerBankAccount.update({
          where: { partner_id: partnerId },
          data: {
            stripe_account_id: stripeAccountId,
            account_holder_name: bankAccountData.accountHolderName,
            account_holder_type: bankAccountData.accountHolderType,
            routing_number: bankAccountData.routingNumber,
            account_number: bankAccountData.accountNumber, // Should be encrypted in production
            bank_name: bankAccountData.bankName,
            account_type: bankAccountData.accountType,
            verification_status: 'pending',
            stripe_account_status: 'pending',
          },
        });
      } else {
        return await prisma.partnerBankAccount.create({
          data: {
            partner_id: partnerId,
            stripe_account_id: stripeAccountId,
            account_holder_name: bankAccountData.accountHolderName,
            account_holder_type: bankAccountData.accountHolderType,
            routing_number: bankAccountData.routingNumber,
            account_number: bankAccountData.accountNumber, // Should be encrypted in production
            bank_name: bankAccountData.bankName,
            account_type: bankAccountData.accountType,
            verification_status: 'pending',
            stripe_account_status: 'pending',
          },
        });
      }
    } catch (error) {
      console.error('Error saving bank account:', error);
      throw error;
    }
  }

  /**
   * Update account status from webhook
   */
  static async updateAccountStatus(accountId, status) {
    try {
      const bankAccount = await prisma.partnerBankAccount.findUnique({
        where: { stripe_account_id: accountId },
      });

      if (bankAccount) {
        return await prisma.partnerBankAccount.update({
          where: { id: bankAccount.id },
          data: {
            stripe_account_status: status,
            verification_status: status === 'active' ? 'verified' : 'pending',
          },
        });
      }
    } catch (error) {
      console.error('Error updating account status:', error);
      throw error;
    }
  }
}

