export type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const DRAFT_PREFIX = 'climafacil:draft:v1:';
export const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function draftKey(...parts: (string | number)[]): string {
  return DRAFT_PREFIX + parts.join(':');
}

/** Every storage key in one place, so a screen never types one by hand. */
export const DRAFT_KEYS = {
  quoteForm: (id?: number) =>
    id === undefined ? draftKey('quote-form', 'new') : draftKey('quote-form', 'edit', id),
  clientForm: (id?: number) =>
    id === undefined ? draftKey('client-form', 'new') : draftKey('client-form', 'edit', id),
  ownerForm: () => draftKey('owner-form', 'new'),
  followUpForm: (quoteId: number) => draftKey('follow-up-form', quoteId),
  statusChangeForm: (quoteId: number) => draftKey('status-change-form', quoteId),
  panelQuotes: () => draftKey('panel', 'quotes'),
  panelClients: () => draftKey('panel', 'clients'),
  panelOwners: () => draftKey('panel', 'owners'),
  panelQuoteDetail: (quoteId: number) => draftKey('panel', 'quote-detail', quoteId),
  panelDashboardFollowUp: () => draftKey('panel', 'dashboard-follow-up'),
  listQuotes: () => draftKey('list', 'quotes'),
  listClients: () => draftKey('list', 'clients'),
  listOwners: () => draftKey('list', 'owners'),
};

/**
 * The storage can be missing or throw even on property access (private mode, blocked site data),
 * so the app must work without it.
 */
export function getBrowserStorage(): DraftStorage | null {
  try {
    return window.localStorage;
  } catch {
    // Access itself may throw a SecurityError; drafts are then simply not kept.
    return null;
  }
}

/** Returns the saved draft, or null when there is none, it is expired or it is unusable. */
export function readDraft<T>(
  storage: DraftStorage | null,
  key: string,
  parse: (value: unknown) => T | null,
  now: number,
): T | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (raw === null) return null;

    const envelope: unknown = JSON.parse(raw);
    const data = readEnvelope(envelope, now);
    const parsed = data === undefined ? null : parse(data);
    if (parsed === null) clearDraft(storage, key);
    return parsed;
  } catch {
    // Corrupted JSON or a storage failure: behave as if there were no draft and drop the entry.
    clearDraft(storage, key);
    return null;
  }
}

function readEnvelope(envelope: unknown, now: number): unknown {
  if (typeof envelope !== 'object' || envelope === null) return undefined;
  if (!('savedAt' in envelope) || !('data' in envelope)) return undefined;
  const { savedAt, data } = envelope;
  if (typeof savedAt !== 'number' || now - savedAt > DRAFT_MAX_AGE_MS) return undefined;
  return data;
}

/**
 * Saves the draft, or removes it when it equals the untouched form, so an empty form leaves no
 * entry behind. Returns false when nothing could be written (e.g. quota exceeded).
 */
export function saveDraft<T>(
  storage: DraftStorage | null,
  key: string,
  data: T,
  initial: T,
  now: number,
): boolean {
  if (!storage) return false;
  if (JSON.stringify(data) === JSON.stringify(initial)) {
    clearDraft(storage, key);
    return true;
  }
  try {
    storage.setItem(key, JSON.stringify({ savedAt: now, data }));
    return true;
  } catch {
    // Quota exceeded or storage blocked: losing the draft must never break typing.
    return false;
  }
}

/** Returns false when the entry could not be removed; it then only expires later. */
export function clearDraft(storage: DraftStorage | null, key: string): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Object with exactly these keys, all strings. External data enters as `unknown`. */
export function isStringRecord<K extends string>(
  value: unknown,
  keys: readonly K[],
): value is Record<K, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record);
  return actual.length === keys.length && keys.every((key) => typeof record[key] === 'string');
}

/* Wrappers that read the clock and the browser storage, kept out of the hooks and components. */

export function readBrowserDraft<T>(key: string, parse: (value: unknown) => T | null): T | null {
  return readDraft(getBrowserStorage(), key, parse, Date.now());
}

export function saveBrowserDraft<T>(key: string, data: T, initial: T): boolean {
  return saveDraft(getBrowserStorage(), key, data, initial, Date.now());
}

export function discardDraft(key: string): void {
  clearDraft(getBrowserStorage(), key);
}
