import type { NewOwner, Owner } from '../domain/owners/owner.js';
import type { PageParams } from '../domain/shared/pagination.js';
import type { OwnerRepository } from '../repositories/owner-repository.js';

export interface OwnerService {
  listOwners(page: PageParams): Promise<{ items: Owner[]; total: number }>;
  createOwner(input: NewOwner): Promise<Owner>;
}

export function createOwnerService(repository: OwnerRepository): OwnerService {
  return {
    async listOwners(page) {
      // `total` counts the whole table, not just the requested page.
      const [items, total] = await Promise.all([repository.findAll(page), repository.count()]);
      return { items, total };
    },

    createOwner(input) {
      return repository.insert(input);
    },
  };
}
