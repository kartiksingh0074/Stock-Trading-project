'use server';

import { prisma } from '@/lib/prisma';

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) return [];

    const items = await prisma.watchlistItem.findMany({
      where: { userId: user.id },
      select: { symbol: true },
    });

    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

export async function getWatchlistByUserId(userId: string) {
  try {
    const items = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
    });

    return items;
  } catch (err) {
    console.error('getWatchlistByUserId error:', err);
    return [];
  }
}

export async function addToWatchlist(userId: string, symbol: string, company: string) {
  try {
    const normalizedSymbol = symbol.toUpperCase().trim();
    const normalizedCompany = company.trim();

    const watchlistItem = await prisma.watchlistItem.upsert({
      where: {
        userId_symbol: {
          userId,
          symbol: normalizedSymbol,
        },
      },
      update: {
        company: normalizedCompany,
      },
      create: {
        userId,
        symbol: normalizedSymbol,
        company: normalizedCompany,
      },
    });

    return { success: true, data: watchlistItem };
  } catch (err) {
    console.error('addToWatchlist error:', err);
    return { success: false, error: 'Failed to add to watchlist' };
  }
}

export async function removeFromWatchlist(userId: string, symbol: string) {
  try {
    const normalizedSymbol = symbol.toUpperCase().trim();

    await prisma.watchlistItem.deleteMany({
      where: {
        userId,
        symbol: normalizedSymbol,
      },
    });

    return { success: true };
  } catch (err) {
    console.error('removeFromWatchlist error:', err);
    return { success: false, error: 'Failed to remove from watchlist' };
  }
}

export async function isInWatchlist(userId: string, symbol: string): Promise<boolean> {
  try {
    const normalizedSymbol = symbol.toUpperCase().trim();

    const item = await prisma.watchlistItem.findUnique({
      where: {
        userId_symbol: {
          userId,
          symbol: normalizedSymbol,
        },
      },
    });

    return !!item;
  } catch (err) {
    console.error('isInWatchlist error:', err);
    return false;
  }
}
