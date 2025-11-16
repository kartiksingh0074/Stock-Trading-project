'use server';

import { prisma } from '@/lib/prisma';

export interface PortfolioSummary {
  totalHoldings: number;
  totalCost: number;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdings: Array<{
    symbol: string;
    company: string;
    quantity: number;
    averageBuyPrice: number;
    totalCost: number;
    currentPrice?: number;
    currentValue?: number;
    gainLoss?: number;
    gainLossPercent?: number;
  }>;
}

export async function getPortfolioHoldings(userId: string) {
  try {
    const holdings = await prisma.portfolioHolding.findMany({
      where: { userId },
      orderBy: { symbol: 'asc' },
    });

    return holdings.map((holding) => ({
      ...holding,
      averageBuyPrice: holding.averageBuyPrice.toNumber(),
      totalCost: holding.totalCost.toNumber(),
    }));
  } catch (err) {
    console.error('getPortfolioHoldings error:', err);
    return [];
  }
}

export async function getPortfolioHolding(userId: string, symbol: string) {
  try {
    const normalizedSymbol = symbol.toUpperCase().trim();

    const holding = await prisma.portfolioHolding.findUnique({
      where: {
        userId_symbol: {
          userId,
          symbol: normalizedSymbol,
        },
      },
    });

    if (!holding) return null;

    return {
      ...holding,
      averageBuyPrice: holding.averageBuyPrice.toNumber(),
      totalCost: holding.totalCost.toNumber(),
    };
  } catch (err) {
    console.error('getPortfolioHolding error:', err);
    return null;
  }
}

export async function getPortfolioSummary(
  userId: string,
  currentPrices?: Record<string, number>
): Promise<PortfolioSummary> {
  try {
    const holdings = await prisma.portfolioHolding.findMany({
      where: { userId },
      orderBy: { symbol: 'asc' },
    });

    let totalCost = 0;
    let totalValue = 0;
    const holdingsWithPrices = [];

    for (const holding of holdings) {
      const cost = holding.totalCost.toNumber();
      totalCost += cost;

      const currentPrice = currentPrices?.[holding.symbol] || null;
      let currentValue = null;
      let gainLoss = null;
      let gainLossPercent = null;

      if (currentPrice !== null) {
        currentValue = currentPrice * holding.quantity;
        totalValue += currentValue;
        gainLoss = currentValue - cost;
        gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;
      }

      holdingsWithPrices.push({
        symbol: holding.symbol,
        company: holding.company,
        quantity: holding.quantity,
        averageBuyPrice: holding.averageBuyPrice.toNumber(),
        totalCost: cost,
        currentPrice: currentPrice || undefined,
        currentValue: currentValue || undefined,
        gainLoss: gainLoss || undefined,
        gainLossPercent: gainLossPercent || undefined,
      });
    }

    const totalGainLoss = totalValue > 0 ? totalValue - totalCost : 0;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      totalHoldings: holdings.length,
      totalCost,
      totalValue: totalValue || totalCost, // Fallback to cost if no prices available
      totalGainLoss,
      totalGainLossPercent,
      holdings: holdingsWithPrices,
    };
  } catch (err) {
    console.error('getPortfolioSummary error:', err);
    return {
      totalHoldings: 0,
      totalCost: 0,
      totalValue: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      holdings: [],
    };
  }
}

export async function getPortfolioValue(userId: string, currentPrices?: Record<string, number>) {
  try {
    const summary = await getPortfolioSummary(userId, currentPrices);
    return {
      totalCost: summary.totalCost,
      totalValue: summary.totalValue,
      totalGainLoss: summary.totalGainLoss,
      totalGainLossPercent: summary.totalGainLossPercent,
    };
  } catch (err) {
    console.error('getPortfolioValue error:', err);
    return {
      totalCost: 0,
      totalValue: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
    };
  }
}

