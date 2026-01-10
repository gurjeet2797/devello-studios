import { verifyAdminAccess } from '../../../../../lib/adminAuth';
import prisma from '../../../../../lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const { isAdmin, error: authError } = await verifyAdminAccess(req);
    if (!isAdmin) {
      return res.status(401).json({ error: authError || 'Unauthorized' });
    }

    const { id } = req.query;

    // Fetch the custom product request with quote
    const request = await prisma.customProductRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        quotes: {
          where: {
            status: 'pending'
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 1
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (!request.quotes || request.quotes.length === 0) {
      return res.status(400).json({ error: 'No pending quote found for this request' });
    }

    const quote = request.quotes[0];

    // Get or create Stripe customer
    let customerId = null;
    if (request.user) {
      const prismaUser = await prisma.user.findUnique({
        where: { id: request.user.id },
        include: {
          subscription: true
        }
      });

      customerId = prismaUser?.subscription?.stripe_customer_id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: request.email,
          metadata: {
            user_id: request.user.id,
          },
        });
        customerId = customer.id;

        // Update user's subscription record if it exists
        if (prismaUser?.subscription) {
          await prisma.subscription.update({
            where: { user_id: request.user.id },
            data: { stripe_customer_id: customerId }
          });
        }
      }
    } else {
      // Create customer for guest
      const customer = await stripe.customers.create({
        email: request.email,
        metadata: {
          custom_product_request_id: id,
        },
      });
      customerId = customer.id;
    }

    // Create Stripe checkout session with custom amount
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: quote.currency.toLowerCase(),
            product_data: {
              name: `Custom ${request.project_type}`,
              description: request.project_description || `Custom order for ${request.project_type}`,
            },
            unit_amount: quote.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/client-portal?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/client-portal?payment=cancelled`,
      metadata: {
        custom_product_request_id: id,
        quote_id: quote.id,
        user_id: request.user?.id || 'guest',
      },
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating payment session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

