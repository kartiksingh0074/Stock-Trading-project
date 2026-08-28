"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Polls an async fetcher on an interval and returns its latest value. No new
// dependency (matches the codebase's preference for hand-rolled solutions) —
// there was no client-side polling pattern anywhere before this.
export function useLivePolling<T>(fetcher: () => Promise<T>, initialValue: T, intervalMs = 20_000) {
  const [value, setValue] = useState<T>(initialValue);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    try {
      const next = await fetcherRef.current();
      setValue(next);
    } catch {
      // Keep showing the last known value on a transient failure.
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { value, refresh };
}
