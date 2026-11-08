// Mirrors the API contract in server/src/routes and server/src/services.
// When the contract changes, change both sides in the same PR (AGENTS.md §5.4).

export const QUOTE_STATUSES = [
  'draft',
  'sent',
  'negotiating',
  'no_response',
  'won',
  'lost',
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

/** Calendar date as `YYYY-MM-DD`, with no time or timezone. */
export type CalendarDate = string;

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  detail: string;
  errors: FieldError[];
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

export interface Owner {
  id: number;
  name: string;
  role: string;
}

export interface NewOwner {
  name: string;
  role: string;
}

export interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

// Also the body of PUT /clients/:id, which replaces the client: a missing e-mail or phone clears it.
export interface NewClient {
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface Quote {
  id: number;
  description: string;
  total: number;
  status: QuoteStatus;
  sentAt: CalendarDate | null;
  isStale: boolean;
  daysWithoutContact: number | null;
  client: { id: number; name: string };
  owner: { id: number; name: string; role: string };
}

export interface NewQuote {
  clientId: number;
  ownerId: number;
  description: string;
  total: number;
  status?: 'draft' | 'sent';
  sentAt?: CalendarDate;
}

/** Status and send date are not editable here; they change through `QuoteStatusChange`. */
export interface QuoteUpdate {
  clientId?: number;
  ownerId?: number;
  description?: string;
  total?: number;
}

export interface QuoteStatusChange {
  status: QuoteStatus;
  sentAt?: CalendarDate;
}

export interface FollowUp {
  id: number;
  quoteId: number;
  contactedAt: CalendarDate;
  description: string | null;
}

export interface NewFollowUp {
  contactedAt?: CalendarDate;
  description?: string;
}

export interface Indicators {
  openTotal: number;
  staleTotal: number;
  /** Fraction from 0 to 1, or null when there are no closed quotes yet. */
  conversionRate: number | null;
}
