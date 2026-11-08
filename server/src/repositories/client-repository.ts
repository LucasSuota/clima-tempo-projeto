import type { Pool } from 'pg';
import type { Client, NewClient } from '../domain/clients/client.js';
import { ALL_ROWS, type PageParams } from '../domain/shared/pagination.js';
import { ClientHasQuotesError, ValidationError } from '../errors.js';

export interface ClientRepository {
  findAll(page?: PageParams): Promise<Client[]>;
  count(): Promise<number>;
  insert(client: NewClient): Promise<Client>;
  update(id: number, client: NewClient): Promise<Client | undefined>;
  remove(id: number): Promise<boolean>;
  existsById(id: number): Promise<boolean>;
}

// pg returns bigint columns as strings.
interface ClientRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

function toClient(row: ClientRow): Client {
  return { id: Number(row.id), name: row.name, email: row.email, phone: row.phone };
}

const UNIQUE_VIOLATION = '23505';

const DUPLICATE_BY_CONSTRAINT: Record<string, { field: string; message: string }> = {
  clients_email_key: { field: 'email', message: 'E-mail já cadastrado' },
  clients_phone_key: { field: 'phone', message: 'Telefone já cadastrado' },
};

// The unique constraints are the source of truth for duplicates: a pre-check would race with
// concurrent inserts. Duck typing keeps the repository independent of the pg error class.
function toDuplicateError(error: unknown): ValidationError | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const { code, constraint } = error as { code?: unknown; constraint?: unknown };
  if (code !== UNIQUE_VIOLATION || typeof constraint !== 'string') return undefined;
  const duplicate = DUPLICATE_BY_CONSTRAINT[constraint];
  return duplicate ? new ValidationError([duplicate]) : undefined;
}

const FOREIGN_KEY_VIOLATION = '23503';

// Same reasoning as the duplicates: the foreign key from quotes is the single source of truth,
// so a "has quotes?" pre-check (racy and redundant) is not needed.
function toHasQuotesError(error: unknown): ClientHasQuotesError | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const { code, constraint } = error as { code?: unknown; constraint?: unknown };
  return code === FOREIGN_KEY_VIOLATION && constraint === 'quotes_client_id_fkey'
    ? new ClientHasQuotesError()
    : undefined;
}

export function createClientRepository(pool: Pool): ClientRepository {
  return {
    async findAll(page = ALL_ROWS) {
      const { rows } = await pool.query<ClientRow>(
        'SELECT id, name, email, phone FROM clients ORDER BY name, id LIMIT $1 OFFSET $2',
        [page.limit, page.offset],
      );
      return rows.map(toClient);
    },

    async count() {
      const { rows } = await pool.query<{ total: number }>(
        'SELECT COUNT(*)::int AS total FROM clients',
      );
      return (rows[0] as { total: number }).total;
    },

    async insert(client) {
      try {
        const { rows } = await pool.query<ClientRow>(
          'INSERT INTO clients (name, email, phone) VALUES ($1, $2, $3) RETURNING id, name, email, phone',
          [client.name, client.email, client.phone],
        );
        return toClient(rows[0] as ClientRow);
      } catch (error) {
        throw toDuplicateError(error) ?? error;
      }
    },

    async update(id, client) {
      try {
        const { rows } = await pool.query<ClientRow>(
          'UPDATE clients SET name = $2, email = $3, phone = $4 WHERE id = $1 RETURNING id, name, email, phone',
          [id, client.name, client.email, client.phone],
        );
        return rows[0] ? toClient(rows[0]) : undefined;
      } catch (error) {
        throw toDuplicateError(error) ?? error;
      }
    },

    async remove(id) {
      try {
        const result = await pool.query('DELETE FROM clients WHERE id = $1', [id]);
        return result.rowCount === 1;
      } catch (error) {
        throw toHasQuotesError(error) ?? error;
      }
    },

    async existsById(id) {
      const { rows } = await pool.query<{ exists: boolean }>(
        'SELECT EXISTS (SELECT 1 FROM clients WHERE id = $1) AS exists',
        [id],
      );
      return rows[0]?.exists === true;
    },
  };
}
