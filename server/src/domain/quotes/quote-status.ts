import { InvalidStatusTransitionError } from '../../errors.js';

export const QUOTE_STATUSES = [
  'draft',
  'sent',
  'negotiating',
  'no_response',
  'won',
  'lost',
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const ALLOWED_TRANSITIONS: Record<QuoteStatus, readonly QuoteStatus[]> = {
  draft: ['sent'],
  sent: ['negotiating', 'no_response', 'won', 'lost'],
  negotiating: ['no_response', 'won', 'lost'],
  no_response: ['negotiating', 'won', 'lost'],
  won: [],
  lost: [],
};

export const OPEN_STATUSES: readonly QuoteStatus[] = ['sent', 'negotiating', 'no_response'];

export function assertTransition(from: QuoteStatus, to: QuoteStatus): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new InvalidStatusTransitionError(from, to);
  }
}
