import type { Client, NewClient } from '../domain/clients/client.js';
import { ClientNotFoundError } from '../errors.js';
import type { ClientRepository } from '../repositories/client-repository.js';

export interface ClientService {
  listClients(): Promise<{ items: Client[]; total: number }>;
  createClient(input: NewClient): Promise<Client>;
  updateClient(id: number, input: NewClient): Promise<Client>;
  deleteClient(id: number): Promise<void>;
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

    async updateClient(id, input) {
      const client = await repository.update(id, input);
      if (!client) throw new ClientNotFoundError();
      return client;
    },

    async deleteClient(id) {
      if (!(await repository.remove(id))) throw new ClientNotFoundError();
    },
  };
}
