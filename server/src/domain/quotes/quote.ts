import { ValidationError, type FieldError } from '../../errors.js';
import { isCalendarDate, type CalendarDate } from '../shared/calendar-date.js';
import { assertTransition, type QuoteStatus } from './quote-status.js';

export interface Quote {
  id: number;
  clientId: number;
  ownerId: number;
  // Decimal string as read from NUMERIC(12,2); the domain does no money arithmetic.
  total: string;
  status: QuoteStatus;
  sentAt: CalendarDate | null;
}

export interface NewQuoteInput {
  total: number;
  status: QuoteStatus;
  sentAt: CalendarDate | null;
}

function sentAtError(sentAt: CalendarDate | null, today: CalendarDate): string | null {
  if (sentAt === null) return 'Obrigatória para este status';
  if (!isCalendarDate(sentAt)) return 'Data inválida';
  if (sentAt > today) return 'Não pode ser futura';
  return null;
}

function totalError(total: number): string | null {
  return Number.isFinite(total) && total > 0 ? null : 'Deve ser maior que zero';
}

export function validateNewQuote(input: NewQuoteInput, today: CalendarDate): void {
  const errors: FieldError[] = [];

  const totalMessage = totalError(input.total);
  if (totalMessage) errors.push({ field: 'total', message: totalMessage });

  if (input.status === 'draft') {
    if (input.sentAt !== null) {
      errors.push({ field: 'sentAt', message: 'Rascunho não tem data de envio' });
    }
  } else {
    const message = sentAtError(input.sentAt, today);
    if (message) errors.push({ field: 'sentAt', message });
  }

  if (errors.length > 0) throw new ValidationError(errors);
}

export interface QuoteEditInput {
  total?: number;
}

// Status and sentAt are not editable here, so only a provided total needs checking.
export function validateQuoteEdit(input: QuoteEditInput): void {
  if (input.total === undefined) return;
  const message = totalError(input.total);
  if (message) throw new ValidationError([{ field: 'total', message }]);
}

export interface StatusChangeInput {
  current: QuoteStatus;
  target: QuoteStatus;
  sentAt: CalendarDate | null;
}

export function changeStatus(
  input: StatusChangeInput,
  today: CalendarDate,
): { status: QuoteStatus; sentAt: CalendarDate | null } {
  assertTransition(input.current, input.target);

  if (input.target === 'sent') {
    const message = sentAtError(input.sentAt, today);
    if (message) throw new ValidationError([{ field: 'sentAt', message }]);
  }

  return { status: input.target, sentAt: input.sentAt };
}
