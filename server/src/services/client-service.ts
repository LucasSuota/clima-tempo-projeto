import type { Client, NewClient } from '../domain/clients/client.js';
import type { ClientRepository } from '../repositories/client-repository.js';

export interface ClientService {
  listClients(): Promise<{ items: Client[]; total: number }>;
  createClient(input: NewClient): Promise<Client>;
}

export function createClientService(repository: ClientRepository): ClientService {
  return {
    async listClients() {
      const items = await repository.findAll();
      return { items, total: items.length };
    },

    createClient(input) {
      return repository.insert(input);
    },
  };
}
