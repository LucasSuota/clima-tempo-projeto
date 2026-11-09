import { describe, expect, it } from 'vitest';
import {
  DRAFT_MAX_AGE_MS,
  clearDraft,
  draftKey,
  isStringRecord,
  readDraft,
  saveDraft,
  type DraftStorage,
} from '../src/draft-storage';

const KEY = draftKey('client-form', 'new');
const NOW = Date.UTC(2026, 2, 20);
const EMPTY = { name: '', email: '' };

function parseForm(value: unknown) {
  return isStringRecord(value, ['name', 'email']) ? value : null;
}

function fakeStorage(overrides: Partial<DraftStorage> = {}) {
  const entries = new Map<string, string>();
  const storage: DraftStorage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => void entries.set(key, value),
    removeItem: (key) => void entries.delete(key),
    ...overrides,
  };
  return { storage, entries };
}

describe('draftKey', () => {
  it('joins the parts under the versioned prefix', () => {
    expect(draftKey('quote-form', 'edit', 12)).toBe('climafacil:draft:v1:quote-form:edit:12');
  });
});

describe('saveDraft and readDraft', () => {
  it('reads back what was saved', () => {
    const { storage } = fakeStorage();
    const draft = { name: 'Carla', email: '' };

    const saved = saveDraft(storage, KEY, draft, EMPTY, NOW);

    expect(saved).toBe(true);
    expect(readDraft(storage, KEY, parseForm, NOW)).toEqual(draft);
  });

  it('removes the entry when the draft equals the initial value', () => {
    const { storage, entries } = fakeStorage();
    saveDraft(storage, KEY, { name: 'Carla', email: '' }, EMPTY, NOW);

    saveDraft(storage, KEY, EMPTY, EMPTY, NOW);

    expect(entries.has(KEY)).toBe(false);
  });

  it('returns false and does not throw when the storage rejects the write', () => {
    const { storage } = fakeStorage({
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });

    expect(saveDraft(storage, KEY, { name: 'Carla', email: '' }, EMPTY, NOW)).toBe(false);
  });

  it('returns false without a storage', () => {
    expect(saveDraft(null, KEY, { name: 'Carla', email: '' }, EMPTY, NOW)).toBe(false);
  });

  it('returns null without a storage', () => {
    expect(readDraft(null, KEY, parseForm, NOW)).toBeNull();
  });

  it('returns null when reading throws', () => {
    const { storage } = fakeStorage({
      getItem: () => {
        throw new Error('SecurityError');
      },
    });

    expect(readDraft(storage, KEY, parseForm, NOW)).toBeNull();
  });
});

describe('readDraft with unusable entries', () => {
  it('returns null and removes the entry when the JSON is invalid', () => {
    const { storage, entries } = fakeStorage();
    entries.set(KEY, '{not json');

    expect(readDraft(storage, KEY, parseForm, NOW)).toBeNull();
    expect(entries.has(KEY)).toBe(false);
  });

  it('returns null and removes the entry when the envelope has no savedAt', () => {
    const { storage, entries } = fakeStorage();
    entries.set(KEY, JSON.stringify({ data: { name: 'Carla', email: '' } }));

    expect(readDraft(storage, KEY, parseForm, NOW)).toBeNull();
    expect(entries.has(KEY)).toBe(false);
  });

  it.each([
    ['a field is not a string', { name: 'Carla', email: 3 }],
    ['a key is missing', { name: 'Carla' }],
    ['an extra key is present', { name: 'Carla', email: '', phone: '1' }],
  ])('returns null and removes the entry when %s', (_label, data) => {
    const { storage, entries } = fakeStorage();
    entries.set(KEY, JSON.stringify({ savedAt: NOW, data }));

    expect(readDraft(storage, KEY, parseForm, NOW)).toBeNull();
    expect(entries.has(KEY)).toBe(false);
  });

  it('returns null and removes the entry once it is older than the maximum age', () => {
    const { storage, entries } = fakeStorage();
    saveDraft(storage, KEY, { name: 'Carla', email: '' }, EMPTY, NOW);

    expect(readDraft(storage, KEY, parseForm, NOW + DRAFT_MAX_AGE_MS + 1)).toBeNull();
    expect(entries.has(KEY)).toBe(false);
  });

  it('still reads an entry exactly at the maximum age', () => {
    const { storage } = fakeStorage();
    saveDraft(storage, KEY, { name: 'Carla', email: '' }, EMPTY, NOW);

    expect(readDraft(storage, KEY, parseForm, NOW + DRAFT_MAX_AGE_MS)).not.toBeNull();
  });
});

describe('clearDraft', () => {
  it('does not propagate a failure to remove', () => {
    const { storage } = fakeStorage({
      removeItem: () => {
        throw new Error('blocked');
      },
    });

    expect(() => clearDraft(storage, KEY)).not.toThrow();
  });
});

describe('isStringRecord', () => {
  it.each([
    ['null', null],
    ['an array', ['a', 'b']],
    ['a string', 'ab'],
    ['a record with a non-string value', { a: 'x', b: 1 }],
    ['a record with a missing key', { a: 'x' }],
    ['a record with an extra key', { a: 'x', b: 'y', c: 'z' }],
  ])('rejects %s', (_label, value) => {
    expect(isStringRecord(value, ['a', 'b'])).toBe(false);
  });

  it('accepts a record with exactly the keys, all strings', () => {
    expect(isStringRecord({ a: 'x', b: '' }, ['a', 'b'])).toBe(true);
  });
});
