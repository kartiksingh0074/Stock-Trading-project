'use server';

import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/utils/logError';

type TxClient = Prisma.TransactionClient;

// Writes a PortfolioSnapshot + keeps User.lastNetWorth in sync, using data already
// in scope inside a trade's transaction — one cheap aggregate over the user's own
// (indexed) holdings, no live-quote calls. Called from inside buyStockForUser/
// sellStockForUser's existing $transaction, right after the cash/holding writes.
export async function recordSnapshotTx(tx: TxClient, userId: string, cashBalance: Decimal): Promise<void> {
  const { _sum } = await tx.portfolioHolding.aggregate({
    where: { userId },
    _sum: { totalCost: true },
  });

  const investedValue = _sum.totalCost ?? new Decimal(0);
  const netWorth = cashBalance.add(investedValue);

  await tx.portfolioSnapshot.create({
    data: { userId, cashBalance, investedValue, netWorth },
  });

  await tx.user.update({
    where: { id: userId },
    data: { lastNetWorth: netWorth },
  });
}

// Seeds a starting point for the net-worth chart right after signup. Best-effort —
// never blocks account creation if it fails.
export async function seedInitialSnapshot(userId: string, cashBalance: Decimal): Promise<void> {
  try {
    await prisma.portfolioSnapshot.create({
      data: { userId, cashBalance, investedValue: new Decimal(0), netWorth: cashBalance },
    });
  } catch (err) {
    logError('snapshot.seedInitialSnapshot', err, { userId });
  }
}
