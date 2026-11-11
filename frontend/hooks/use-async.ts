"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Runs an async loader on mount and again on `reload()`. `loader` must be a
 * stable reference (a module-level function such as the ones in lib/api.ts).
 *
 * - `reload()`  shows the loading state again (skeletons).
 * - `refresh()` fetches quietly in the background (used for polling); a failed
 *   refresh keeps the data already on screen.
 * - `setData`   lets pages update the list locally after a delete.
 */
export function useAsync<T>(loader: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loader()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setState({
            data: null,
            loading: false,
            error: e instanceof Error ? e.message : "Something went wrong",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [loader, attempt]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setAttempt((n) => n + 1);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await loader();
      if (mounted.current) setState({ data, loading: false, error: null });
    } catch {
      /* keep what is on screen; the next refresh will try again */
    }
  }, [loader]);

  const setData = useCallback(
    (updater: (prev: T) => T) =>
      setState((s) => (s.data ? { ...s, data: updater(s.data) } : s)),
    [],
  );

  return { ...state, reload, refresh, setData };
}
