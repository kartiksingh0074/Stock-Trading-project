import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe/client';
import { logError } from '@/lib/utils/logError';

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logError('payment.webhook', new Error('STRIPE_WEBHOOK_SECRET is not configured'));
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    logError('payment.webhook.signature', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const checkoutSession = event.data.object as Stripe.Checkout.Session;

  try {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { stripeSessionId: checkoutSession.id },
      });

      if (!payment) {
        // Nothing we created a Payment row for (shouldn't happen for our own
        // Checkout Sessions) — acknowledge so Stripe doesn't keep retrying.
        return;
      }

      // Idempotency: Stripe can deliver the same event more than once.
      if (payment.status === 'COMPLETED') {
        return;
      }

      await tx.user.update({
        where: { id: payment.userId },
        data: {
          cashBalance: { increment: payment.creditsGranted },
          tier: 'PRO',
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          stripePaymentIntentId:
            typeof checkoutSession.payment_intent === 'string'
              ? checkoutSession.payment_intent
              : checkoutSession.payment_intent?.id,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json({ received: true });
  } catch (err) {
    logError('payment.webhook.credit', err, { sessionId: checkoutSession.id });
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
