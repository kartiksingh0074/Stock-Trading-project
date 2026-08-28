'use server';

import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth/session';
import { logError } from '@/lib/utils/logError';

export async function getUserBalance() {
  try {
    const userId = await requireUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cashBalance: true },
    });

    return user ? user.cashBalance.toNumber() : 0;
  } catch (err) {
    logError('wallet.getUserBalance', err);
    return 0;
  }
}

export interface NetWorthPoint {
  capturedAt: string;
  cashBalance: number;
  investedValue: number;
  netWorth: number;
}

// Cost-basis-based history (see PortfolioSnapshot) — not live market value.
// Written once per trade, so the trend has a point at every buy/sell.
export async function getNetWorthHistory(days = 90): Promise<NetWorthPoint[]> {
  try {
    const userId = await requireUserId();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: { userId, capturedAt: { gte: since } },
      orderBy: { capturedAt: 'asc' },
    });

    return snapshots.map((s) => ({
      capturedAt: s.capturedAt.toISOString(),
      cashBalance: s.cashBalance.toNumber(),
      investedValue: s.investedValue.toNumber(),
      netWorth: s.netWorth.toNumber(),
    }));
  } catch (err) {
    logError('wallet.getNetWorthHistory', err);
    return [];
  }
}

