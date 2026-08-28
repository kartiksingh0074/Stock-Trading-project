'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { cache } from 'react';
import { getRedis, getFinnhubLimiter } from '@/lib/redis/client';
import { logError } from '@/lib/utils/logError';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

function getFinnhubApiKey() {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) throw new Error('FINNHUB API key is not configured');
  return token;
}

// Stale copies are kept much longer than the "fresh" TTL so a rate-limited request
// can still serve something useful instead of failing outright.
const STALE_MULTIPLIER = 10;
const STALE_MIN_TTL_SECONDS = 3600;

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
  const redis = getRedis();
  const cacheKey = revalidateSeconds ? `finnhub:v1:${url}` : null;
  const staleKey = cacheKey ? `finnhub:v1:stale:${url}` : null;

  if (cacheKey && redis) {
    try {
      const cached = await redis.get<T>(cacheKey);
      if (cached !== null && cached !== undefined) return cached;
    } catch (err) {
      logError('finnhub.cache.read', err, { url });
    }
  }

  const limiter = getFinnhubLimiter();
  if (limiter) {
    let limited = false;
    try {
      limited = !(await limiter.limit('finnhub')).success;
    } catch (err) {
      // Redis/limiter unreachable (e.g. misconfigured) — fail open rather than
      // blocking every Finnhub call because the limiter itself is down.
      logError('finnhub.ratelimit', err, { url });
    }

    if (limited) {
      if (staleKey && redis) {
        try {
          const stale = await redis.get<T>(staleKey);
          if (stale !== null && stale !== undefined) return stale;
        } catch (err) {
          logError('finnhub.cache.stale-read', err, { url });
        }
      }
      throw new Error('RATE_LIMITED: Finnhub request rate limit reached, please try again shortly');
    }
  }

  const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
    ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
    : { cache: 'no-store' };

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Fetch failed ${res.status}: ${text}`);
  }
  const data = (await res.json()) as T;

  if (redis && cacheKey && staleKey && revalidateSeconds) {
    try {
      await Promise.all([
        redis.set(cacheKey, data, { ex: revalidateSeconds }),
        redis.set(staleKey, data, { ex: Math.max(revalidateSeconds * STALE_MULTIPLIER, STALE_MIN_TTL_SECONDS) }),
      ]);
    } catch (err) {
      logError('finnhub.cache.write', err, { url });
    }
  }

  return data;
}

export { fetchJSON };

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    const range = getDateRange(5);
    const token = getFinnhubApiKey();
    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    // If we have symbols, try to fetch company news per symbol and round-robin select
    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      await Promise.all(
        cleanSymbols.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
            const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
            perSymbolArticles[sym] = (articles || []).filter(validateArticle);
          } catch (e) {
            logError('finnhub.getNews.companyNews', e, { symbol: sym });
            perSymbolArticles[sym] = [];
          }
        })
      );

      const collected: MarketNewsArticle[] = [];
      // Round-robin up to 6 picks
      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanSymbols.length; i++) {
          const sym = cleanSymbols[i];
          const list = perSymbolArticles[sym] || [];
          if (list.length === 0) continue;
          const article = list.shift();
          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, sym, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        // Sort by datetime desc
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
      // If none collected, fall through to general news
    }

    // General market news fallback or when no symbols provided
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= 20) break; // cap early before final slicing
    }

    const formatted = unique.slice(0, maxArticles).map((a, idx) => formatArticle(a, false, undefined, idx));
    return formatted;
  } catch (err) {
    logError('finnhub.getNews', err);
    throw new Error('Failed to fetch news');
  }
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    const token = getFinnhubApiKey();

    const trimmed = typeof query === 'string' ? query.trim() : '';

    let results: FinnhubSearchResult[] = [];

    // Extra field carried alongside search results only for the "popular symbols" branch below.
    const exchangeBySymbol = new Map<string, string | undefined>();

    if (!trimmed) {
      // Fetch top 10 popular symbols' profiles
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
      const profiles = await Promise.all(
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
            // Revalidate every hour
            const profile = await fetchJSON<FinnhubProfile2>(url, 3600);
            return { sym, profile };
          } catch (e) {
            logError('finnhub.searchStocks.profile', e, { symbol: sym });
            return { sym, profile: null as FinnhubProfile2 | null };
          }
        })
      );

      results = profiles
        .map(({ sym, profile }) => {
          const symbol = sym.toUpperCase();
          const name: string | undefined = profile?.name || profile?.ticker || undefined;
          if (!name) return undefined;
          exchangeBySymbol.set(symbol, profile?.exchange);
          const r: FinnhubSearchResult = {
            symbol,
            description: name,
            displaySymbol: symbol,
            type: 'Common Stock',
          };
          return r;
        })
        .filter((x): x is FinnhubSearchResult => Boolean(x));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
      const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
      results = Array.isArray(data?.result) ? data.result : [];
    }

    const mapped: StockWithWatchlistStatus[] = results
      .map((r) => {
        const upper = (r.symbol || '').toUpperCase();
        const name = r.description || upper;
        const exchangeFromDisplay = (r.displaySymbol as string | undefined) || undefined;
        const exchangeFromProfile = exchangeBySymbol.get(upper);
        const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
        const type = r.type || 'Stock';
        const item: StockWithWatchlistStatus = {
          symbol: upper,
          name,
          exchange,
          type,
          isInWatchlist: false,
        };
        return item;
      })
      .slice(0, 15);

    return mapped;
  } catch (err) {
    logError('finnhub.searchStocks', err);
    return [];
  }
});

export async function getStockQuote(symbol: string): Promise<{ price: number; changePercent: number } | null> {
  try {
    const token = getFinnhubApiKey();

    const normalizedSymbol = symbol.toUpperCase().trim();
    const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(normalizedSymbol)}&token=${token}`;
    const quote = await fetchJSON<{ c?: number; dp?: number }>(url, 60); // Cache for 60 seconds

    if (quote?.c && quote.c > 0) {
      return {
        price: quote.c,
        changePercent: quote.dp || 0,
      };
    }

    return null;
  } catch (err) {
    logError('finnhub.getStockQuote', err, { symbol });
    return null;
  }
}

export async function getStockProfile(symbol: string): Promise<{
  name: string;
  exchange: string;
  logo?: string;
  marketCapitalization?: number;
  pe?: number;
} | null> {
  try {
    const token = getFinnhubApiKey();

    const normalizedSymbol = symbol.toUpperCase().trim();
    const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(normalizedSymbol)}&token=${token}`;
    const profile = await fetchJSON<{
      name?: string;
      exchange?: string;
      logo?: string;
      marketCapitalization?: number;
      pe?: number;
    }>(url, 3600); // Cache for 1 hour

    if (profile?.name) {
      return {
        name: profile.name,
        exchange: profile.exchange || 'US',
        logo: profile.logo,
        marketCapitalization: profile.marketCapitalization,
        pe: profile.pe,
      };
    }

    return null;
  } catch (err) {
    logError('finnhub.getStockProfile', err, { symbol });
    return null;
  }
}

