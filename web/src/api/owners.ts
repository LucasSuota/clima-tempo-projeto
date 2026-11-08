import { request, withPage } from './client';
import type { ListResponse, NewOwner, Owner, PageQuery } from './types';

export function listOwners(page?: PageQuery): Promise<ListResponse<Owner>> {
  return request(withPage('/owners', page));
}

export function createOwner(input: NewOwner): Promise<Owner> {
  return request('/owners', { method: 'POST', body: input });
}
