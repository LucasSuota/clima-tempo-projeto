import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { discardDraft, readBrowserDraft, saveBrowserDraft } from '../draft-storage';

/**
 * `useState` whose value survives a reload: it starts from the saved draft (when valid) and saves
 * every change. A value equal to `initial` removes the entry. `key` must not change while the
 * component is mounted; remount with a React `key` to switch items.
 *
 * `discard` removes the entry right away and goes back to `initial`.
 */
export function usePersistedState<T>(
  key: string,
  initial: T,
  parse: (value: unknown) => T | null,
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const [baseline] = useState(initial);
  const [value, setValue] = useState<T>(() => readBrowserDraft(key, parse) ?? baseline);

  useEffect(() => {
    saveBrowserDraft(key, value, baseline);
  }, [key, value, baseline]);

  function discard() {
    // Synchronous, so the entry is gone even if the component unmounts before the next effect.
    discardDraft(key);
    setValue(baseline);
  }

  return [value, setValue, discard];
}
