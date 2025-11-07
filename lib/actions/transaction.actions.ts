'use server';

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface BuyStockParams {
  userId: string;
  symbol: string;
  company: string;
  quantity: number;
  price: number;
}

export interface SellStockParams {
  userId: string;
  symbol: string;
  company: string;
  quantity: number;
  price: number;
}

export async function buyStock({ userId, symbol, company, quantity, price }: BuyStockParams) {
  try {
    if (quantity <= 0 || price <= 0) {
      return { success: false, error: 'Quantity and price must be greater than 0' };
    }

    const normalizedSymbol = symbol.toUpperCase().trim();
    const normalizedCompany = company.trim();
    const totalAmount = new Decimal(quantity * price);

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check user's cash balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { cashBalance: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const currentBalance = user.cashBalance.toNumber();
      const totalCost = totalAmount.toNumber();

      if (currentBalance < totalCost) {
        throw new Error(`Insufficient funds. You have $${currentBalance.toFixed(2)} but need $${totalCost.toFixed(2)}`);
      }

      // Deduct cash from user's balance
      await tx.user.update({
        where: { id: userId },
        data: {
          cashBalance: new Decimal(currentBalance - totalCost),
        },
      });

      // Create the transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          symbol: normalizedSymbol,
          company: normalizedCompany,
          type: 'BUY',
          quantity,
          price: new Decimal(price),
          totalAmount,
        },
      });

      // Update or create portfolio holding
      const existingHolding = await tx.portfolioHolding.findUnique({
        where: {
          userId_symbol: {
            userId,
            symbol: normalizedSymbol,
          },
        },
      });

      if (existingHolding) {
        // Calculate new average buy price: (oldTotalCost + newTotalCost) / (oldQuantity + newQuantity)
        const oldTotalCost = existingHolding.totalCost.toNumber();
        const newTotalCost = totalAmount.toNumber();
        const newQuantity = existingHolding.quantity + quantity;
        const newAveragePrice = (oldTotalCost + newTotalCost) / newQuantity;
        const newTotalCostValue = new Decimal(oldTotalCost + newTotalCost);

        await tx.portfolioHolding.update({
          where: {
            userId_symbol: {
              userId,
              symbol: normalizedSymbol,
            },
          },
          data: {
            quantity: newQuantity,
            averageBuyPrice: new Decimal(newAveragePrice),
            totalCost: newTotalCostValue,
            company: normalizedCompany,
          },
        });
      } else {
        // Create new holding
        await tx.portfolioHolding.create({
          data: {
            userId,
            symbol: normalizedSymbol,
            company: normalizedCompany,
            quantity,
            averageBuyPrice: new Decimal(price),
            totalCost: totalAmount,
          },
        });
      }

      return transaction;
    });

    return { success: true, data: result };
  } catch (err) {
    console.error('buyStock error:', err);
    return { success: false, error: 'Failed to buy stock' };
  }
}

export async function sellStock({ userId, symbol, company, quantity, price }: SellStockParams) {
  try {
    if (quantity <= 0 || price <= 0) {
      return { success: false, error: 'Quantity and price must be greater than 0' };
    }

    const normalizedSymbol = symbol.toUpperCase().trim();
    const normalizedCompany = company.trim();
    const totalAmount = new Decimal(quantity * price);

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if user has enough shares
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

      // Create the transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          symbol: normalizedSymbol,
          company: normalizedCompany,
          type: 'SELL',
          quantity,
          price: new Decimal(price),
          totalAmount,
        },
      });

      const newQuantity = existingHolding.quantity - quantity;

      // Add cash back to user's balance
      const sellAmount = totalAmount.toNumber();
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { cashBalance: true },
      });

      if (user) {
        await tx.user.update({
          where: { id: userId },
          data: {
            cashBalance: new Decimal(user.cashBalance.toNumber() + sellAmount),
          },
        });
      }

      if (newQuantity === 0) {
        // Remove holding if quantity becomes zero
        await tx.portfolioHolding.delete({
          where: {
            userId_symbol: {
              userId,
              symbol: normalizedSymbol,
            },
          },
        });
      } else {
        // Update holding quantity and total cost
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

      return transaction;
    });

    return { success: true, data: result };
  } catch (err) {
    console.error('sellStock error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to sell stock';
    return { success: false, error: errorMessage };
  }
}

export async function getTransactionsByUserId(userId: string, limit?: number) {
  try {
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
    console.error('getTransactionsByUserId error:', err);
    return [];
  }
}

export async function getTransactionById(transactionId: string, userId: string) {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    return transaction;
  } catch (err) {
    console.error('getTransactionById error:', err);
    return null;
  }
}

