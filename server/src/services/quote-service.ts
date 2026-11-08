import { changeStatus, validateNewQuote, validateQuoteEdit } from '../domain/quotes/quote.js';
import type { QuoteDetails } from '../domain/quotes/quote-details.js';
import type { QuoteStatus } from '../domain/quotes/quote-status.js';
import { effectiveStatus, evaluateStaleness } from '../domain/quotes/stale-quote.js';
import { toCalendarDate, type CalendarDate } from '../domain/shared/calendar-date.js';
import type { PageParams } from '../domain/shared/pagination.js';
import { QuoteNotFoundError, ValidationError, type FieldError } from '../errors.js';
import type { ClientRepository } from '../repositories/client-repository.js';
import type { OwnerRepository } from '../repositories/owner-repository.js';
import type { QuoteRepository } from '../repositories/quote-repository.js';

export interface QuoteResponse {
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

export interface CreateQuoteInput {
  clientId: number;
  ownerId: number;
  description: string;
  total: number;
  status: QuoteStatus;
  sentAt: CalendarDate | null;
}

export interface UpdateQuoteInput {
  clientId?: number;
  ownerId?: number;
  description?: string;
  total?: number;
}

export interface QuoteService {
  listQuotes(page: PageParams): Promise<{ items: QuoteResponse[]; total: number }>;
  listStaleQuotes(): Promise<{ items: QuoteResponse[]; total: number }>;
  getQuote(id: number): Promise<QuoteResponse>;
  createQuote(input: CreateQuoteInput): Promise<QuoteResponse>;
  changeQuoteStatus(
    id: number,
    input: { status: QuoteStatus; sentAt: CalendarDate | null },
  ): Promise<QuoteResponse>;
  updateQuote(id: number, input: UpdateQuoteInput): Promise<QuoteResponse>;
  deleteQuote(id: number): Promise<void>;
}

export interface QuoteServiceDependencies {
  quotes: QuoteRepository;
  clients: ClientRepository;
  owners: OwnerRepository;
  staleDays: number;
  now: () => Date;
}

export function createQuoteService({
  quotes,
  clients,
  owners,
  staleDays,
  now,
}: QuoteServiceDependencies): QuoteService {
  function staleInput(quote: QuoteDetails) {
    return {
      status: quote.status,
      sentAt: quote.sentAt,
      followUpDates: quote.lastFollowUpAt ? [quote.lastFollowUpAt] : [],
    };
  }

  function toResponse(quote: QuoteDetails, today: CalendarDate): QuoteResponse {
    const input = staleInput(quote);
    const { isStale, daysWithoutContact } = evaluateStaleness(input, today, staleDays);
    return {
      id: quote.id,
      description: quote.description,
      total: quote.total,
      status: effectiveStatus(input, today, staleDays),
      sentAt: quote.sentAt,
      isStale,
      daysWithoutContact,
      client: quote.client,
      owner: quote.owner,
    };
  }

  // Stale quotes always have a number of days; the tie-breakers make the queue order deterministic.
  function byContactPriority(a: QuoteResponse, b: QuoteResponse): number {
    return (
      (b.daysWithoutContact ?? 0) - (a.daysWithoutContact ?? 0) || b.total - a.total || a.id - b.id
    );
  }

  async function findOrFail(id: number): Promise<QuoteDetails> {
    const quote = await quotes.findById(id);
    if (!quote) throw new QuoteNotFoundError();
    return quote;
  }

  // Reports both missing references at once so the form can mark every wrong field.
  async function assertReferencesExist(clientId: number, ownerId: number): Promise<void> {
    const [clientExists, ownerExists] = await Promise.all([
      clients.existsById(clientId),
      owners.existsById(ownerId),
    ]);
    const errors: FieldError[] = [];
    if (!clientExists) errors.push({ field: 'clientId', message: 'Cliente não encontrado' });
    if (!ownerExists) errors.push({ field: 'ownerId', message: 'Responsável não encontrado' });
    if (errors.length > 0) throw new ValidationError(errors);
  }

  return {
    async listQuotes(page) {
      const today = toCalendarDate(now());
      const [rows, total] = await Promise.all([quotes.findAll(page), quotes.count()]);
      return { items: rows.map((quote) => toResponse(quote, today)), total };
    },

    async listStaleQuotes() {
      const today = toCalendarDate(now());
      const items = (await quotes.findAll())
        .map((quote) => toResponse(quote, today))
        .filter((quote) => quote.isStale)
        .sort(byContactPriority);
      return { items, total: items.length };
    },

    async getQuote(id) {
      return toResponse(await findOrFail(id), toCalendarDate(now()));
    },

    async createQuote(input) {
      const today = toCalendarDate(now());
      validateNewQuote(input, today);
      await assertReferencesExist(input.clientId, input.ownerId);
      const id = await quotes.insert(input);
      return toResponse(await findOrFail(id), today);
    },

    async changeQuoteStatus(id, { status, sentAt }) {
      const today = toCalendarDate(now());
      const quote = await findOrFail(id);
      // The effective status is what the user sees, so a stale `sent` quote is moved
      // from `no_response`, not from the stored `sent`.
      const current = effectiveStatus(staleInput(quote), today, staleDays);
      const next = changeStatus(
        { current, target: status, sentAt: status === 'sent' ? sentAt : quote.sentAt },
        today,
      );
      await quotes.updateStatus(id, next.status, next.sentAt);
      return toResponse(await findOrFail(id), today);
    },

    async updateQuote(id, input) {
      validateQuoteEdit(input);
      const quote = await findOrFail(id);
      // Fields left out of the edit keep the quote's current references.
      await assertReferencesExist(
        input.clientId ?? quote.client.id,
        input.ownerId ?? quote.owner.id,
      );
      await quotes.update(id, input);
      return toResponse(await findOrFail(id), toCalendarDate(now()));
    },

    async deleteQuote(id) {
      if (!(await quotes.remove(id))) throw new QuoteNotFoundError();
    },
  };
}
