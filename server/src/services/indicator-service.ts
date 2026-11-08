import { conversionRate } from '../domain/indicators/indicators.js';
import { OPEN_STATUSES } from '../domain/quotes/quote-status.js';
import type { IndicatorRepository } from '../repositories/indicator-repository.js';
import type { QuoteService } from './quote-service.js';

export interface IndicatorsResponse {
  openTotal: number;
  staleTotal: number;
  conversionRate: number | null;
}

export interface IndicatorService {
  getIndicators(): Promise<IndicatorsResponse>;
}

export interface IndicatorServiceDependencies {
  quotes: Pick<QuoteService, 'listStaleQuotes'>;
  indicators: IndicatorRepository;
}

export function createIndicatorService({
  quotes,
  indicators,
}: IndicatorServiceDependencies): IndicatorService {
  return {
    async getIndicators() {
      // Same path as the contact queue, so the stale total can never disagree with it.
      const stale = await quotes.listStaleQuotes();
      const totals = await indicators.getTotals(
        OPEN_STATUSES,
        stale.items.map((quote) => quote.id),
      );
      return {
        openTotal: totals.openTotal,
        staleTotal: totals.staleTotal,
        conversionRate: conversionRate(totals.wonCount, totals.lostCount),
      };
    },
  };
}
