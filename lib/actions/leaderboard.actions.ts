'use server';

import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth/session';
import { logError } from '@/lib/utils/logError';

export interface LeaderboardEntry {
  id: string;
  name: string;
  netWorth: number;
  isCurrentUser: boolean;
}

// Ranked by User.lastNetWorth — cost-basis portfolio value, updated after each trade
// (see PortfolioSnapshot). Not live intraday market value.
export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  try {
    const userId = await requireUserId();
    const users = await prisma.user.findMany({
      orderBy: { lastNetWorth: 'desc' },
      take: limit,
      select: { id: true, name: true, lastNetWorth: true },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name || 'Anonymous Trader',
      netWorth: u.lastNetWorth.toNumber(),
      isCurrentUser: u.id === userId,
    }));
  } catch (err) {
    logError('leaderboard.getLeaderboard', err);
    return [];
  }
}
