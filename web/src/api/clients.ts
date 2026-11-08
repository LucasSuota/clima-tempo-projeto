import { request, withPage } from './client';
import type { Client, ListResponse, NewClient, PageQuery } from './types';

export function listClients(page?: PageQuery): Promise<ListResponse<Client>> {
  return request(withPage('/clients', page));
}

export function createClient(input: NewClient): Promise<Client> {
  return request('/clients', { method: 'POST', body: input });
}

export function updateClient(id: number, input: NewClient): Promise<Client> {
  return request(`/clients/${id}`, { method: 'PUT', body: input });
}

export function deleteClient(id: number): Promise<void> {
  return request(`/clients/${id}`, { method: 'DELETE' });
}
