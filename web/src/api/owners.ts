import { request } from './client';
import type { ListResponse, NewOwner, Owner } from './types';

export function listOwners(): Promise<ListResponse<Owner>> {
  return request('/owners');
}

export function createOwner(input: NewOwner): Promise<Owner> {
  return request('/owners', { method: 'POST', body: input });
}
