import { validateFollowUp } from '../domain/follow-ups/follow-up-rules.js';
import type { FollowUp } from '../domain/follow-ups/follow-up.js';
import { toCalendarDate, type CalendarDate } from '../domain/shared/calendar-date.js';
import type { PageParams } from '../domain/shared/pagination.js';
import { QuoteNotFoundError } from '../errors.js';
import type { FollowUpRepository } from '../repositories/follow-up-repository.js';
import type { QuoteRepository } from '../repositories/quote-repository.js';

export interface FollowUpService {
  listFollowUps(quoteId: number, page: PageParams): Promise<{ items: FollowUp[]; total: number }>;
  createFollowUp(
    quoteId: number,
    input: { contactedAt?: CalendarDate; description: string | null },
  ): Promise<FollowUp>;
}

export interface FollowUpServiceDependencies {
  quotes: QuoteRepository;
  followUps: FollowUpRepository;
  now: () => Date;
}

export function createFollowUpService({
  quotes,
  followUps,
  now,
}: FollowUpServiceDependencies): FollowUpService {
  async function findQuoteOrFail(quoteId: number) {
    const quote = await quotes.findById(quoteId);
    if (!quote) throw new QuoteNotFoundError();
    return quote;
  }

  return {
    async listFollowUps(quoteId, page) {
      await findQuoteOrFail(quoteId);
      const [items, total] = await Promise.all([
        followUps.findByQuoteId(quoteId, page),
        followUps.countByQuoteId(quoteId),
      ]);
      return { items, total };
    },

    async createFollowUp(quoteId, input) {
      const today = toCalendarDate(now());
      const quote = await findQuoteOrFail(quoteId);
      const contactedAt = input.contactedAt ?? today;
      // Uses the stored status: a stale `sent` quote still accepts contact.
      validateFollowUp({ status: quote.status, sentAt: quote.sentAt }, contactedAt, today);
      return followUps.insert({ quoteId, contactedAt, description: input.description });
    },
  };
}
