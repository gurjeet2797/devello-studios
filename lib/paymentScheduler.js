import prisma from './prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export class PaymentScheduler {
  /**
   * Check for scheduled payments that are due and execute them
   */
  static async processScheduledPayments() {
    try {
      const now = new Date();
      
      // Find payments scheduled for today or earlier that are still pending
      const scheduledPayments = await prisma.payment.findMany({
        where: {
          scheduled_date: {
            lte: now,
          },
          status: 'pending',
        },
        include: {
          invoice: {
            include: {
              partner: {
                include: {
                  bankAccount: true,
                },
              },
            },
          },
          order: {
            include: {
              partner: {
                include: {
                  bankAccount: true,
                },
              },
            },
          },
          productOrder: true,
          user: {
            include: {
              subscription: true,
            },
          },
        },
      });

      console.log(`Found ${scheduledPayments.length} scheduled payments to process`);

      for (const payment of scheduledPayments) {
        try {
          await this.executeScheduledPayment(payment);
        } catch (error) {
          console.error(`Error processing scheduled payment ${payment.id}:`, error);
          // Update payment status to failed
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'failed',
              failed_at: new Date(),
            },
          });
        }
      }

      return {
        processed: scheduledPayments.length,
        success: true,
      };
    } catch (error) {
      console.error('Error processing scheduled payments:', error);
      throw error;
    }
  }

  /**
   * Execute a scheduled payment
   */
  static async executeScheduledPayment(payment) {
    try {
      // Get customer's default payment method
      const customerId = payment.user.subscription?.stripe_customer_id;
      if (!customerId) {
        throw new Error('Customer does not have a Stripe customer ID');
      }

      // Get customer's payment methods
      const customer = await stripe.customers.retrieve(customerId);
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      if (paymentMethods.data.length === 0) {
        throw new Error('Customer has no saved payment methods');
      }

      const preferredId =
        customer?.invoice_settings?.default_payment_method ||
        customer?.default_source ||
        null;
      const defaultPaymentMethod =
        paymentMethods.data.find((pm) => pm.id === preferredId) ||
        paymentMethods.data[0];

      // Determine if this is a Connect payment (partner) or direct payment
      let paymentIntent;
      const partnerId = payment.invoice?.partner_id || payment.order?.partner_id;
      
      if (partnerId) {
        // Partner payment - use Stripe Connect
        const bankAccount = payment.invoice?.partner?.bankAccount || payment.order?.partner?.bankAccount;
        
        if (!bankAccount || !bankAccount.stripe_account_id) {
          throw new Error('Partner has not set up payment account');
        }

        paymentIntent = await stripe.paymentIntents.create({
          amount: payment.amount,
          currency: payment.currency,
          customer: customerId,
          payment_method: defaultPaymentMethod.id,
          confirm: true,
          off_session: true,
          application_fee_amount: 0, // No platform fee
          transfer_data: {
            destination: bankAccount.stripe_account_id,
          },
          metadata: {
            payment_id: payment.id,
            invoice_id: payment.invoice_id || '',
            order_id: payment.order_id || '',
            scheduled: 'true',
          },
        });
      } else {
        // Direct Devello payment
        paymentIntent = await stripe.paymentIntents.create({
          amount: payment.amount,
          currency: payment.currency,
          customer: customerId,
          payment_method: defaultPaymentMethod.id,
          confirm: true,
          off_session: true,
          metadata: {
            payment_id: payment.id,
            product_order_id: payment.product_order_id || '',
            scheduled: 'true',
          },
        });
      }

      // Map Stripe status to internal status without prematurely failing intents
      const intentStatus = paymentIntent.status;
      const isSuccess = intentStatus === 'succeeded';
      const isPending =
        intentStatus === 'processing' ||
        intentStatus === 'requires_action' ||
        intentStatus === 'requires_confirmation' ||
        intentStatus === 'requires_capture';
      const isFailure = intentStatus === 'canceled' || intentStatus === 'requires_payment_method';

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          stripe_payment_intent_id: paymentIntent.id,
          stripe_charge_id: paymentIntent.charges?.data?.[0]?.id || null,
          status: isSuccess ? 'succeeded' : isPending ? 'pending' : isFailure ? 'failed' : 'pending',
          paid_at: isSuccess ? new Date() : null,
          failed_at: isFailure ? new Date() : null,
        },
      });

      // Update invoice/product order status if payment succeeded
      if (paymentIntent.status === 'succeeded') {
        if (payment.invoice_id) {
          await prisma.invoice.update({
            where: { id: payment.invoice_id },
            data: { status: 'paid', paid_at: new Date() },
          });
        }
        if (payment.product_order_id) {
          await prisma.productOrder.update({
            where: { id: payment.product_order_id },
            data: { status: 'completed', payment_status: 'paid', purchased_at: new Date() },
          });
        }
      }

      // TODO: Send notification email

      console.log(`Scheduled payment ${payment.id} processed: ${paymentIntent.status}`);

      return paymentIntent;
    } catch (error) {
      console.error(`Error executing scheduled payment ${payment.id}:`, error);
      throw error;
    }
  }

  /**
   * Schedule a future payment
   */
  static async schedulePayment(paymentData) {
    try {
      const {
        invoiceId,
        orderId,
        productOrderId,
        userId,
        amount,
        currency,
        scheduledDate,
        paymentType,
      } = paymentData;

      // Create payment record with scheduled date
      const payment = await prisma.payment.create({
        data: {
          invoice_id: invoiceId || null,
          order_id: orderId || null,
          product_order_id: productOrderId || null,
          user_id: userId,
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          status: 'pending',
          payment_type: paymentType || 'final',
          scheduled_date: new Date(scheduledDate),
        },
      });

      console.log(`Payment ${payment.id} scheduled for ${scheduledDate}`);

      return payment;
    } catch (error) {
      console.error('Error scheduling payment:', error);
      throw error;
    }
  }
}

