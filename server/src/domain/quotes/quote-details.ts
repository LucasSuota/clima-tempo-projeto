import type { CalendarDate } from '../shared/calendar-date.js';
import type { QuoteStatus } from './quote-status.js';

// Read model: a quote with the data the screens need, as stored (status is not yet the effective one).
export interface QuoteDetails {
  id: number;
  description: string;
  total: number;
  status: QuoteStatus;
  sentAt: CalendarDate | null;
  lastFollowUpAt: CalendarDate | null;
  client: { id: number; name: string };
  owner: { id: number; name: string; role: string };
}
