import type { Pool } from 'pg';
import type { NewOwner, Owner } from '../domain/owners/owner.js';
import { ALL_ROWS, type PageParams } from '../domain/shared/pagination.js';

export interface OwnerRepository {
  findAll(page?: PageParams): Promise<Owner[]>;
  count(): Promise<number>;
  insert(owner: NewOwner): Promise<Owner>;
  existsById(id: number): Promise<boolean>;
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
    async findAll(page = ALL_ROWS) {
      const { rows } = await pool.query<OwnerRow>(
        'SELECT id, name, role FROM owners ORDER BY name, id LIMIT $1 OFFSET $2',
        [page.limit, page.offset],
      );
      return rows.map(toOwner);
    },

    async count() {
      const { rows } = await pool.query<{ total: number }>(
        'SELECT COUNT(*)::int AS total FROM owners',
      );
      return (rows[0] as { total: number }).total;
    },

    async insert(owner) {
      const { rows } = await pool.query<OwnerRow>(
        'INSERT INTO owners (name, role) VALUES ($1, $2) RETURNING id, name, role',
        [owner.name, owner.role],
      );
      return toOwner(rows[0] as OwnerRow);
    },

    async existsById(id) {
      const { rows } = await pool.query<{ exists: boolean }>(
        'SELECT EXISTS (SELECT 1 FROM owners WHERE id = $1) AS exists',
        [id],
      );
      return rows[0]?.exists === true;
    },
  };
}
