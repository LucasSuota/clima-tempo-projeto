import { QUOTE_STATUSES, type QuoteStatus } from './api/types';

/* Shapes and parsers of the UI state that survives a reload (open panels, search, filter, page). */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

/** `null` means the panel is closed. */
export type CrudPanel = { kind: 'create' } | { kind: 'edit'; id: number };

export function parseCrudPanel(value: unknown): CrudPanel | null {
  if (!isRecord(value)) return null;
  if (value.kind === 'create') return { kind: 'create' };
  if (value.kind === 'edit' && isPositiveInteger(value.id)) return { kind: 'edit', id: value.id };
  return null;
}

/** Panel of the quote detail screen: the quote itself is the route, so there is no id here. */
export interface EditPanel {
  kind: 'edit';
}

export function parseEditPanel(value: unknown): EditPanel | null {
  return isRecord(value) && value.kind === 'edit' ? { kind: 'edit' } : null;
}

export interface QuoteIdPanel {
  quoteId: number;
}

export function parseQuoteIdPanel(value: unknown): QuoteIdPanel | null {
  return isRecord(value) && isPositiveInteger(value.quoteId) ? { quoteId: value.quoteId } : null;
}

export type StatusFilter = 'all' | QuoteStatus | 'stale';

export interface QuotesListState {
  search: string;
  filter: StatusFilter;
  page: number;
}

export interface SearchListState {
  search: string;
  page: number;
}

function isStatusFilter(value: unknown): value is StatusFilter {
  return (
    value === 'all' ||
    value === 'stale' ||
    (typeof value === 'string' && (QUOTE_STATUSES as readonly string[]).includes(value))
  );
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => key in value);
}

export function parseQuotesListState(value: unknown): QuotesListState | null {
  if (!isRecord(value) || !hasExactKeys(value, ['search', 'filter', 'page'])) return null;
  const { search, filter, page } = value;
  if (typeof search !== 'string' || !isStatusFilter(filter) || !isPositiveInteger(page)) {
    return null;
  }
  return { search, filter, page };
}

export function parseSearchListState(value: unknown): SearchListState | null {
  if (!isRecord(value) || !hasExactKeys(value, ['search', 'page'])) return null;
  const { search, page } = value;
  if (typeof search !== 'string' || !isPositiveInteger(page)) return null;
  return { search, page };
}
