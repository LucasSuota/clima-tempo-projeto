import { FollowUpNotAllowedError, ValidationError } from '../../errors.js';
import { isCalendarDate, type CalendarDate } from '../shared/calendar-date.js';
import { type QuoteStatus } from '../quotes/quote-status.js';

export interface FollowUpTarget {
  status: QuoteStatus;
  sentAt: CalendarDate | null;
}

// Does not change the quote status. Accepted on won/lost (it only records the contact).
export function validateFollowUp(
  quote: FollowUpTarget,
  contactedAt: CalendarDate,
  today: CalendarDate,
): void {
  if (quote.status === 'draft') throw new FollowUpNotAllowedError();

  const fail = (message: string): never => {
    throw new ValidationError([{ field: 'contactedAt', message }]);
  };

  if (!isCalendarDate(contactedAt)) fail('Data inválida');
  if (contactedAt > today) fail('Não pode ser futura');
  if (quote.sentAt !== null && contactedAt < quote.sentAt) fail('Não pode ser anterior ao envio');
}
