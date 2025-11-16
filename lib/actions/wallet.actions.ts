'use server';

import { prisma } from '@/lib/prisma';

export async function getUserBalance(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cashBalance: true },
    });

    return user ? user.cashBalance.toNumber() : 0;
  } catch (err) {
    console.error('getUserBalance error:', err);
    return 0;
  }
}

