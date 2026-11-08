import { request } from './client';
import type { Client, ListResponse, NewClient } from './types';

export function listClients(): Promise<ListResponse<Client>> {
  return request('/clients');
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
