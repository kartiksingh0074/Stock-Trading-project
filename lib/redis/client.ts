import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let redisInstance: Redis | null = null;
let finnhubLimiterInstance: Ratelimit | null = null;

// Upstash's SDK retries + its default fetch timeout mean a single call against an
// unreachable/misconfigured host can hang for ~5-10s. Since Redis here is best-effort
// (every call site fails open), a slow failure is worse than no Redis at all — cap it
// hard so a bad config degrades to "no caching" instantly instead of stalling every
// request that touches Finnhub data.
const REDIS_TIMEOUT_MS = 1500;

export function getRedis(): Redis | null {
    if (redisInstance) return redisInstance;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;

    redisInstance = new Redis({
        url,
        token,
        retry: { retries: 0 },
        signal: () => AbortSignal.timeout(REDIS_TIMEOUT_MS),
    });
    return redisInstance;
}

// Guards outbound Finnhub calls so a burst of concurrent users can't blow through Finnhub's rate limit.
export function getFinnhubLimiter(): Ratelimit | null {
    if (finnhubLimiterInstance) return finnhubLimiterInstance;

    const redis = getRedis();
    if (!redis) return null;

    finnhubLimiterInstance = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "10 s"),
        prefix: "ratelimit:finnhub",
    });
    return finnhubLimiterInstance;
}
