import type { NewOwner, Owner } from '../domain/owners/owner.js';
import type { OwnerRepository } from '../repositories/owner-repository.js';

export interface OwnerService {
  listOwners(): Promise<{ items: Owner[]; total: number }>;
  createOwner(input: NewOwner): Promise<Owner>;
}

export function createOwnerService(repository: OwnerRepository): OwnerService {
  return {
    async listOwners() {
      const items = await repository.findAll();
      return { items, total: items.length };
    },

    createOwner(input) {
      return repository.insert(input);
    },
  };
}
