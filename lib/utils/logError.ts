export function logError(action: string, err: unknown, context?: Record<string, unknown>) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${action}]`, message, context ? { ...context } : "", err instanceof Error ? err.stack : "");
}
