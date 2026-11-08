import type { Pool } from 'pg';
import type { NewOwner, Owner } from '../domain/owners/owner.js';

export interface OwnerRepository {
  findAll(): Promise<Owner[]>;
  insert(owner: NewOwner): Promise<Owner>;
}

// pg returns bigint columns as strings.
interface OwnerRow {
  id: string;
  name: string;
  role: string;
}

function toOwner(row: OwnerRow): Owner {
  return { id: Number(row.id), name: row.name, role: row.role };
}

export function createOwnerRepository(pool: Pool): OwnerRepository {
  return {
    async findAll() {
      const { rows } = await pool.query<OwnerRow>(
        'SELECT id, name, role FROM owners ORDER BY name, id',
      );
      return rows.map(toOwner);
    },

    async insert(owner) {
      const { rows } = await pool.query<OwnerRow>(
        'INSERT INTO owners (name, role) VALUES ($1, $2) RETURNING id, name, role',
        [owner.name, owner.role],
      );
      return toOwner(rows[0] as OwnerRow);
    },
  };
}
