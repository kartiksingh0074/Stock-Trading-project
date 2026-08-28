'use server';

import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth/session';
import { getStockQuote } from '@/lib/actions/finnhub.actions';
import { logError } from '@/lib/utils/logError';

function toAlertType(direction: 'UPPER' | 'LOWER'): 'upper' | 'lower' {
  return direction === 'UPPER' ? 'upper' : 'lower';
}

function toDirection(alertType: 'upper' | 'lower'): 'UPPER' | 'LOWER' {
  return alertType === 'upper' ? 'UPPER' : 'LOWER';
}

export async function createAlert(data: AlertData) {
  try {
    const userId = await requireUserId();
    const normalizedSymbol = data.symbol.toUpperCase().trim();
    const normalizedCompany = data.company.trim();
    const alertName = data.alertName.trim();
    const threshold = new Decimal(data.threshold);

    if (!normalizedSymbol || !normalizedCompany || !alertName) {
      return { success: false, error: 'Alert details are invalid' };
    }
    if (!threshold.isFinite() || threshold.lte(0)) {
      return { success: false, error: 'Threshold must be a positive number' };
    }

    const alert = await prisma.priceAlert.create({
      data: {
        userId,
        symbol: normalizedSymbol,
        company: normalizedCompany,
        alertName,
        alertType: toDirection(data.alertType),
        threshold,
      },
    });

    return { success: true, data: alert };
  } catch (err) {
    logError('alert.createAlert', err, { symbol: data.symbol });
    return { success: false, error: 'Failed to create alert' };
  }
}

export async function updateAlert(alertId: string, data: AlertData) {
  try {
    const userId = await requireUserId();
    const alertName = data.alertName.trim();
    const threshold = new Decimal(data.threshold);

    if (!alertName) {
      return { success: false, error: 'Alert name is required' };
    }
    if (!threshold.isFinite() || threshold.lte(0)) {
      return { success: false, error: 'Threshold must be a positive number' };
    }

    const result = await prisma.priceAlert.updateMany({
      where: { id: alertId, userId },
      data: {
        alertName,
        alertType: toDirection(data.alertType),
        threshold,
        status: 'ACTIVE',
        triggeredAt: null,
      },
    });

    if (result.count === 0) {
      return { success: false, error: 'Alert not found' };
    }
    return { success: true };
  } catch (err) {
    logError('alert.updateAlert', err, { alertId });
    return { success: false, error: 'Failed to update alert' };
  }
}

export async function deleteAlert(alertId: string) {
  try {
    const userId = await requireUserId();
    await prisma.priceAlert.deleteMany({ where: { id: alertId, userId } });
    return { success: true };
  } catch (err) {
    logError('alert.deleteAlert', err, { alertId });
    return { success: false, error: 'Failed to delete alert' };
  }
}

// Core logic, independent of the request context — checks the user's ACTIVE alerts
// against a fresh (cached, rate-limited) quote per unique symbol and flips any
// crossed alert to TRIGGERED. Called lazily whenever alerts are read — there is no
// background job, so alerts only update while the app is being used.
export async function checkAndUpdateAlertsForUser(userId: string): Promise<void> {
  const activeAlerts = await prisma.priceAlert.findMany({
    where: { userId, status: 'ACTIVE' },
  });
  if (activeAlerts.length === 0) return;

  const uniqueSymbols = [...new Set(activeAlerts.map((a) => a.symbol))];
  const quotesBySymbol = new Map<string, number>();

  await Promise.all(
    uniqueSymbols.map(async (symbol) => {
      const quote = await getStockQuote(symbol);
      if (quote) quotesBySymbol.set(symbol, quote.price);
    })
  );

  const triggeredIds = activeAlerts
    .filter((alert) => {
      const currentPrice = quotesBySymbol.get(alert.symbol);
      if (currentPrice === undefined) return false;
      const threshold = alert.threshold.toNumber();
      return alert.alertType === 'UPPER' ? currentPrice >= threshold : currentPrice <= threshold;
    })
    .map((a) => a.id);

  if (triggeredIds.length > 0) {
    await prisma.priceAlert.updateMany({
      where: { id: { in: triggeredIds } },
      data: { status: 'TRIGGERED', triggeredAt: new Date() },
    });
  }
}

export async function getUserAlerts(): Promise<Alert[]> {
  try {
    const userId = await requireUserId();

    try {
      await checkAndUpdateAlertsForUser(userId);
    } catch (err) {
      logError('alert.checkAndUpdateAlertsForUser', err, { userId });
    }

    const alerts = await prisma.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const uniqueSymbols = [...new Set(alerts.map((a) => a.symbol))];
    const quotesBySymbol = new Map<string, { price: number; changePercent: number }>();
    await Promise.all(
      uniqueSymbols.map(async (symbol) => {
        const quote = await getStockQuote(symbol);
        if (quote) quotesBySymbol.set(symbol, quote);
      })
    );

    return alerts.map((a) => ({
      id: a.id,
      symbol: a.symbol,
      company: a.company,
      alertName: a.alertName,
      currentPrice: quotesBySymbol.get(a.symbol)?.price ?? 0,
      alertType: toAlertType(a.alertType),
      threshold: a.threshold.toNumber(),
      changePercent: quotesBySymbol.get(a.symbol)?.changePercent,
      status: a.status,
    }));
  } catch (err) {
    logError('alert.getUserAlerts', err);
    return [];
  }
}
