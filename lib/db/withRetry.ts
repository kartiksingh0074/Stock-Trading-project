import { Prisma } from '@prisma/client';

// MySQL aborts a Serializable transaction under contention; Prisma surfaces this
// as P2034 ("Transaction failed due to a write conflict or a deadlock"). Retrying
// a handful of times with a short backoff lets legitimate concurrent requests
// (e.g. two quick clicks, or two users trading unrelated symbols) succeed instead
// of surfacing a generic failure on the first collision.
const WRITE_CONFLICT_CODE = 'P2034';
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 50;

function isWriteConflict(err: unknown): boolean {
    return (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === WRITE_CONFLICT_CODE
    );
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withSerializableRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            if (!isWriteConflict(err) || attempt === MAX_ATTEMPTS) throw err;
            await delay(BASE_DELAY_MS * attempt);
        }
    }
    throw lastErr;
}
