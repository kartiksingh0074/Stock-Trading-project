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

export async function addFunds(userId: string, amount: number) {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cashBalance: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const newBalance = user.cashBalance.toNumber() + amount;

    await prisma.user.update({
      where: { id: userId },
      data: { cashBalance: newBalance },
    });

    return { success: true, balance: newBalance };
  } catch (err) {
    console.error('addFunds error:', err);
    return { success: false, error: 'Failed to add funds' };
  }
}

