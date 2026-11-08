import { request } from './client';
import type { FollowUp, ListResponse, NewFollowUp } from './types';

export function listFollowUps(quoteId: number): Promise<ListResponse<FollowUp>> {
  return request(`/quotes/${quoteId}/follow-ups`);
}

export function createFollowUp(quoteId: number, input: NewFollowUp): Promise<FollowUp> {
  return request(`/quotes/${quoteId}/follow-ups`, { method: 'POST', body: input });
}
