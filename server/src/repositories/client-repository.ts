import type { Pool } from 'pg';
import type { Client, NewClient } from '../domain/clients/client.js';
import { ValidationError } from '../errors.js';

export interface ClientRepository {
  findAll(): Promise<Client[]>;
  insert(client: NewClient): Promise<Client>;
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

export function createClientRepository(pool: Pool): ClientRepository {
  return {
    async findAll() {
      const { rows } = await pool.query<ClientRow>(
        'SELECT id, name, email, phone FROM clients ORDER BY name, id',
      );
      return rows.map(toClient);
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

    async existsById(id) {
      const { rows } = await pool.query<{ exists: boolean }>(
        'SELECT EXISTS (SELECT 1 FROM clients WHERE id = $1) AS exists',
        [id],
      );
      return rows[0]?.exists === true;
    },
  };
}
