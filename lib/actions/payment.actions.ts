'use server';

import { prisma } from '@/lib/prisma';
import { requireUserId, requireSession } from '@/lib/auth/session';
import { getStripe } from '@/lib/stripe/client';
import { getPlanById, getStripePriceId } from '@/lib/stripe/plans';
import { logError } from '@/lib/utils/logError';

export async function createCheckoutSession(planId: string) {
  try {
    const userId = await requireUserId();
    const session = await requireSession();

    const plan = getPlanById(planId);
    if (!plan) {
      return { success: false, error: 'Unknown plan' };
    }

    const priceId = getStripePriceId(plan);
    const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: session.user.email ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, planId },
      success_url: `${baseUrl}/upgrade?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/upgrade?status=cancelled`,
    });

    if (!checkoutSession.url) {
      return { success: false, error: 'Failed to create checkout session' };
    }

    await prisma.payment.create({
      data: {
        userId,
        stripeSessionId: checkoutSession.id,
        amountCents: plan.priceCents,
        currency: plan.currency,
        planId: plan.id,
        creditsGranted: plan.creditAmount,
        status: 'PENDING',
      },
    });

    return { success: true, url: checkoutSession.url };
  } catch (err) {
    logError('payment.createCheckoutSession', err, { planId });
    return { success: false, error: 'Failed to start checkout' };
  }
}

export async function getUserPlanInfo() {
  try {
    const userId = await requireUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, cashBalance: true },
    });

    return {
      tier: user?.tier ?? 'FREE',
      cashBalance: user?.cashBalance.toNumber() ?? 0,
    };
  } catch (err) {
    logError('payment.getUserPlanInfo', err);
    return { tier: 'FREE' as const, cashBalance: 0 };
  }
}

export async function getPaymentHistory() {
  try {
    const userId = await requireUserId();
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p) => ({
      ...p,
      creditsGranted: p.creditsGranted.toNumber(),
    }));
  } catch (err) {
    logError('payment.getPaymentHistory', err);
    return [];
  }
}
