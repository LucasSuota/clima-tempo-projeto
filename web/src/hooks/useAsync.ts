import { useCallback, useEffect, useState } from 'react';

type Result<T> = { version: number; data: T } | { version: number; error: Error };

interface AsyncState<T> {
  data: T | undefined;
  error: Error | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Runs `load` and exposes its state. `load` must be stable (a module-level function or a
 * `useCallback`), otherwise every render would start a new request.
 */
export function useAsync<T>(load: () => Promise<T>): AsyncState<T> {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  // Keeps the last successful data while reloading, so the screen does not flash empty.
  const [lastData, setLastData] = useState<T | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    load().then(
      (data) => {
        if (cancelled) return;
        setResult({ version, data });
        setLastData(data);
      },
      (error: unknown) => {
        if (cancelled) return;
        setResult({ version, error: error instanceof Error ? error : new Error(String(error)) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [load, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  // `loading` is derived from the version, so no state is set synchronously inside the effect.
  const loading = result?.version !== version;
  const error = result && 'error' in result && !loading ? result.error : null;

  return { data: lastData, error, loading, reload };
}
