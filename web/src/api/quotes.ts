import { request } from './client';
import type { ListResponse, NewQuote, Quote, QuoteStatusChange } from './types';

export function listQuotes(): Promise<ListResponse<Quote>> {
  return request('/quotes');
}

export function getQuote(id: number): Promise<Quote> {
  return request(`/quotes/${id}`);
}

export function createQuote(input: NewQuote): Promise<Quote> {
  return request('/quotes', { method: 'POST', body: input });
}

export function changeQuoteStatus(id: number, change: QuoteStatusChange): Promise<Quote> {
  return request(`/quotes/${id}/status`, { method: 'PATCH', body: change });
}

export function listStaleQuotes(): Promise<ListResponse<Quote>> {
  return request('/quotes/stale');
}
