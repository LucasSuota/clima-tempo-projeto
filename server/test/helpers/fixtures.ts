import type { Pool } from 'pg';

export async function insertClient(pool: Pool, name = 'Ana Souza'): Promise<number> {
  const { rows } = await pool.query<{ id: string }>(
    'INSERT INTO clients (name) VALUES ($1) RETURNING id',
    [name],
  );
  return Number((rows[0] as { id: string }).id);
}

export async function insertOwner(
  pool: Pool,
  name = 'Marina Costa',
  role = 'Vendedora',
): Promise<number> {
  const { rows } = await pool.query<{ id: string }>(
    'INSERT INTO owners (name, role) VALUES ($1, $2) RETURNING id',
    [name, role],
  );
  return Number((rows[0] as { id: string }).id);
}

export interface QuoteFixture {
  clientId: number;
  ownerId: number;
  description?: string;
  total?: number;
  status?: string;
  sentAt?: string | null;
}

export async function insertQuote(pool: Pool, quote: QuoteFixture): Promise<number> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO quotes (client_id, owner_id, description, total, status, sent_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      quote.clientId,
      quote.ownerId,
      quote.description ?? 'Instalação de split',
      quote.total ?? 1500,
      quote.status ?? 'draft',
      quote.sentAt ?? null,
    ],
  );
  return Number((rows[0] as { id: string }).id);
}

export async function insertFollowUp(
  pool: Pool,
  quoteId: number,
  contactedAt: string,
  description: string | null = null,
): Promise<void> {
  await pool.query(
    'INSERT INTO follow_ups (quote_id, contacted_at, description) VALUES ($1, $2, $3)',
    [quoteId, contactedAt, description],
  );
}
