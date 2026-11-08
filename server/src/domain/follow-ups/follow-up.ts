import { type CalendarDate } from '../shared/calendar-date.js';

export interface FollowUp {
  id: number;
  quoteId: number;
  contactedAt: CalendarDate;
  description: string | null;
}
