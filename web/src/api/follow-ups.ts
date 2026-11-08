import { request, withPage } from './client';
import type { FollowUp, ListResponse, NewFollowUp, PageQuery } from './types';

export function listFollowUps(quoteId: number, page?: PageQuery): Promise<ListResponse<FollowUp>> {
  return request(withPage(`/quotes/${quoteId}/follow-ups`, page));
}

export function createFollowUp(quoteId: number, input: NewFollowUp): Promise<FollowUp> {
  return request(`/quotes/${quoteId}/follow-ups`, { method: 'POST', body: input });
}
