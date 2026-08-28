'use server';

import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth/session';
import { logError } from '@/lib/utils/logError';

export async function getWatchlistSymbols(): Promise<string[]> {
  try {
    const userId = await requireUserId();

    const items = await prisma.watchlistItem.findMany({
      where: { userId },
      select: { symbol: true },
    });

    return items.map((i) => String(i.symbol));
  } catch (err) {
    logError('watchlist.getWatchlistSymbols', err);
    return [];
  }
}

export async function getWatchlist() {
  try {
    const userId = await requireUserId();
    const items = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
    });

    return items;
  } catch (err) {
    logError('watchlist.getWatchlist', err);
    return [];
  }
}

export async function addToWatchlist(symbol: string, company: string) {
  try {
    const userId = await requireUserId();
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
    logError('watchlist.addToWatchlist', err, { symbol });
    return { success: false, error: 'Failed to add to watchlist' };
  }
}

export async function removeFromWatchlist(symbol: string) {
  try {
    const userId = await requireUserId();
    const normalizedSymbol = symbol.toUpperCase().trim();

    await prisma.watchlistItem.deleteMany({
      where: {
        userId,
        symbol: normalizedSymbol,
      },
    });

    return { success: true };
  } catch (err) {
    logError('watchlist.removeFromWatchlist', err, { symbol });
    return { success: false, error: 'Failed to remove from watchlist' };
  }
}

export async function isInWatchlist(symbol: string): Promise<boolean> {
  try {
    const userId = await requireUserId();
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
    logError('watchlist.isInWatchlist', err, { symbol });
    return false;
  }
}
