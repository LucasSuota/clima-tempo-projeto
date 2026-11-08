import { daysBetween, type CalendarDate } from '../shared/calendar-date.js';
import { OPEN_STATUSES, type QuoteStatus } from './quote-status.js';

export interface StaleInput {
  status: QuoteStatus;
  sentAt: CalendarDate | null;
  followUpDates: readonly CalendarDate[];
}

export interface Staleness {
  isStale: boolean;
  daysWithoutContact: number | null;
}

// Last contact = latest follow-up, or the send date when there is none.
// Follow-ups may arrive in any order, so take the maximum (ISO dates compare as strings).
export function getLastContact(
  sentAt: CalendarDate,
  followUpDates: readonly CalendarDate[],
): CalendarDate {
  return followUpDates.reduce((latest, date) => (date > latest ? date : latest), sentAt);
}

export function evaluateStaleness(
  quote: StaleInput,
  today: CalendarDate,
  staleDays: number,
): Staleness {
  if (!OPEN_STATUSES.includes(quote.status) || quote.sentAt === null) {
    return { isStale: false, daysWithoutContact: null };
  }

  const daysWithoutContact = daysBetween(getLastContact(quote.sentAt, quote.followUpDates), today);
  return { isStale: daysWithoutContact >= staleDays, daysWithoutContact };
}

// no_response is derived on read: only a stale `sent` quote becomes it.
// A stale `negotiating` quote keeps its status; a stored `no_response` stays as is.
export function effectiveStatus(
  quote: StaleInput,
  today: CalendarDate,
  staleDays: number,
): QuoteStatus {
  if (quote.status === 'sent' && evaluateStaleness(quote, today, staleDays).isStale) {
    return 'no_response';
  }
  return quote.status;
}
