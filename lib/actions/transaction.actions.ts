'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { requireUserId } from '@/lib/auth/session';
import { getStockQuote } from '@/lib/actions/finnhub.actions';
import { withSerializableRetry } from '@/lib/db/withRetry';
import { logError } from '@/lib/utils/logError';
import { recordSnapshotTx } from '@/lib/actions/snapshot.actions';

const MAX_ORDER_QUANTITY = 1_000_000;
const MAX_ORDER_PRICE = new Decimal('1000000');

export interface BuyStockParams {
  symbol: string;
  company: string;
  quantity: number;
  // Informational only — the client's last-seen quote, shown for the confirmation total.
  // The server always re-fetches the live price and uses that for the actual charge.
  price?: number;
}

export interface SellStockParams {
  symbol: string;
  company: string;
  quantity: number;
  price?: number;
}

// Fetches the current market price server-side so a tampered/stale client-submitted
// price can never be used to settle a trade.
async function resolveAuthoritativePrice(symbol: string): Promise<Decimal> {
  const quote = await getStockQuote(symbol);
  if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) {
    throw new Error('Unable to fetch the current market price. Please try again.');
  }
  const unitPrice = new Decimal(quote.price.toFixed(2));
  if (unitPrice.gt(MAX_ORDER_PRICE)) {
    throw new Error('Order details are invalid');
  }
  return unitPrice;
}

// Core logic, independent of the Next.js request context — directly testable
// (e.g. by scripts/test-concurrent-trading.mjs) and reused by the 'use server' wrapper below.
export async function buyStockForUser(userId: string, { symbol, company, quantity }: BuyStockParams) {
  try {
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > MAX_ORDER_QUANTITY) {
      return { success: false, error: 'Quantity is invalid' };
    }

    const normalizedSymbol = symbol.toUpperCase().trim();
    const normalizedCompany = company.trim();
    if (!normalizedSymbol || !normalizedCompany) {
      return { success: false, error: 'Order details are invalid' };
    }

    const unitPrice = await resolveAuthoritativePrice(normalizedSymbol);
    const totalAmount = unitPrice.mul(quantity);

    const result = await withSerializableRetry(() =>
      prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { cashBalance: true },
        });

        if (!user) {
          throw new Error('User not found');
        }

        if (user.cashBalance.lt(totalAmount)) {
          throw new Error(`Insufficient funds. You have $${user.cashBalance.toFixed(2)} but need $${totalAmount.toFixed(2)}`);
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            cashBalance: { decrement: totalAmount },
          },
        });

        const transaction = await tx.transaction.create({
          data: {
            userId,
            symbol: normalizedSymbol,
            company: normalizedCompany,
            type: 'BUY',
            quantity,
            price: unitPrice,
            totalAmount,
          },
        });

        const existingHolding = await tx.portfolioHolding.findUnique({
          where: {
            userId_symbol: {
              userId,
              symbol: normalizedSymbol,
            },
          },
        });

        if (existingHolding) {
          const newQuantity = existingHolding.quantity + quantity;
          const newTotalCostValue = existingHolding.totalCost.add(totalAmount);
          const newAveragePrice = newTotalCostValue.div(newQuantity);

          await tx.portfolioHolding.update({
            where: {
              userId_symbol: {
                userId,
                symbol: normalizedSymbol,
              },
            },
            data: {
              quantity: newQuantity,
              averageBuyPrice: newAveragePrice,
              totalCost: newTotalCostValue,
              company: normalizedCompany,
            },
          });
        } else {
          await tx.portfolioHolding.create({
            data: {
              userId,
              symbol: normalizedSymbol,
              company: normalizedCompany,
              quantity,
              averageBuyPrice: unitPrice,
              totalCost: totalAmount,
            },
          });
        }

        await recordSnapshotTx(tx, userId, updatedUser.cashBalance);

        return transaction;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    );

    return { success: true, data: result };
  } catch (err) {
    logError('transaction.buyStock', err, { userId, symbol });
    const errorMessage = err instanceof Error ? err.message : 'Failed to buy stock';
    return { success: false, error: errorMessage };
  }
}

export async function sellStockForUser(userId: string, { symbol, company, quantity }: SellStockParams) {
  try {
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > MAX_ORDER_QUANTITY) {
      return { success: false, error: 'Quantity is invalid' };
    }

    const normalizedSymbol = symbol.toUpperCase().trim();
    const normalizedCompany = company.trim();
    if (!normalizedSymbol || !normalizedCompany) {
      return { success: false, error: 'Order details are invalid' };
    }

    const unitPrice = await resolveAuthoritativePrice(normalizedSymbol);
    const totalAmount = unitPrice.mul(quantity);

    const result = await withSerializableRetry(() =>
      prisma.$transaction(async (tx) => {
        const existingHolding = await tx.portfolioHolding.findUnique({
          where: {
            userId_symbol: {
              userId,
              symbol: normalizedSymbol,
            },
          },
        });

        if (!existingHolding) {
          throw new Error('You do not own any shares of this stock');
        }

        if (existingHolding.quantity < quantity) {
          throw new Error(`Insufficient shares. You only have ${existingHolding.quantity} shares`);
        }

        const transaction = await tx.transaction.create({
          data: {
            userId,
            symbol: normalizedSymbol,
            company: normalizedCompany,
            type: 'SELL',
            quantity,
            price: unitPrice,
            totalAmount,
          },
        });

        const newQuantity = existingHolding.quantity - quantity;

        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { cashBalance: true },
        });

        if (!user) {
          throw new Error('User not found');
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { cashBalance: { increment: totalAmount } },
        });

        if (newQuantity === 0) {
          await tx.portfolioHolding.delete({
            where: {
              userId_symbol: {
                userId,
                symbol: normalizedSymbol,
              },
            },
          });
        } else {
          // Average buy price stays the same (FIFO or average cost basis)
          const newTotalCost = existingHolding.averageBuyPrice.mul(newQuantity);

          await tx.portfolioHolding.update({
            where: {
              userId_symbol: {
                userId,
                symbol: normalizedSymbol,
              },
            },
            data: {
              quantity: newQuantity,
              totalCost: newTotalCost,
            },
          });
        }

        await recordSnapshotTx(tx, userId, updatedUser.cashBalance);

        return transaction;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    );

    return { success: true, data: result };
  } catch (err) {
    logError('transaction.sellStock', err, { userId, symbol });
    const errorMessage = err instanceof Error ? err.message : 'Failed to sell stock';
    return { success: false, error: errorMessage };
  }
}

export async function buyStock(params: BuyStockParams) {
  const userId = await requireUserId();
  return buyStockForUser(userId, params);
}

export async function sellStock(params: SellStockParams) {
  const userId = await requireUserId();
  return sellStockForUser(userId, params);
}

export async function getTransactions(limit?: number) {
  try {
    const userId = await requireUserId();
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { executedAt: 'desc' },
      take: limit,
    });

    // Convert Decimal to number for client-side usage
    return transactions.map((t) => ({
      ...t,
      price: t.price.toNumber(),
      totalAmount: t.totalAmount.toNumber(),
    }));
  } catch (err) {
    logError('transaction.getTransactions', err);
    return [];
  }
}

export async function getTransactionById(transactionId: string) {
  try {
    const userId = await requireUserId();
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    return transaction;
  } catch (err) {
    logError('transaction.getTransactionById', err, { transactionId });
    return null;
  }
}
