import type { Pool } from 'pg';
import type { QuoteDetails } from '../domain/quotes/quote-details.js';
import type { QuoteStatus } from '../domain/quotes/quote-status.js';
import type { CalendarDate } from '../domain/shared/calendar-date.js';

export interface NewQuoteRecord {
  clientId: number;
  ownerId: number;
  description: string;
  total: number;
  status: QuoteStatus;
  sentAt: CalendarDate | null;
}

export interface QuoteRepository {
  findAll(): Promise<QuoteDetails[]>;
  findById(id: number): Promise<QuoteDetails | undefined>;
  insert(quote: NewQuoteRecord): Promise<number>;
  updateStatus(id: number, status: QuoteStatus, sentAt: CalendarDate | null): Promise<void>;
}

// pg returns bigint and numeric columns as strings.
interface QuoteRow {
  id: string;
  description: string;
  total: string;
  status: QuoteStatus;
  sent_at: string | null;
  last_follow_up_at: string | null;
  client_id: string;
  client_name: string;
  owner_id: string;
  owner_name: string;
  owner_role: string;
}

function toQuoteDetails(row: QuoteRow): QuoteDetails {
  return {
    id: Number(row.id),
    description: row.description,
    total: Number(row.total),
    status: row.status,
    sentAt: row.sent_at,
    lastFollowUpAt: row.last_follow_up_at,
    client: { id: Number(row.client_id), name: row.client_name },
    owner: { id: Number(row.owner_id), name: row.owner_name, role: row.owner_role },
  };
}

// One query for the whole list (no N+1); grouping by the primary keys lets the other
// columns of quotes, clients and owners be selected without aggregating them.
const SELECT_QUOTES = `
  SELECT q.id, q.description, q.total, q.status,
         to_char(q.sent_at, 'YYYY-MM-DD') AS sent_at,
         to_char(MAX(f.contacted_at), 'YYYY-MM-DD') AS last_follow_up_at,
         c.id AS client_id, c.name AS client_name,
         o.id AS owner_id, o.name AS owner_name, o.role AS owner_role
  FROM quotes q
  JOIN clients c ON c.id = q.client_id
  JOIN owners o ON o.id = q.owner_id
  LEFT JOIN follow_ups f ON f.quote_id = q.id`;

const GROUP_QUOTES = 'GROUP BY q.id, c.id, o.id';

export function createQuoteRepository(pool: Pool): QuoteRepository {
  return {
    async findAll() {
      const { rows } = await pool.query<QuoteRow>(
        `${SELECT_QUOTES} ${GROUP_QUOTES} ORDER BY q.created_at DESC, q.id DESC`,
      );
      return rows.map(toQuoteDetails);
    },

    async findById(id) {
      const { rows } = await pool.query<QuoteRow>(
        `${SELECT_QUOTES} WHERE q.id = $1 ${GROUP_QUOTES}`,
        [id],
      );
      return rows[0] ? toQuoteDetails(rows[0]) : undefined;
    },

    async insert(quote) {
      const { rows } = await pool.query<{ id: string }>(
        `INSERT INTO quotes (client_id, owner_id, description, total, status, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [quote.clientId, quote.ownerId, quote.description, quote.total, quote.status, quote.sentAt],
      );
      return Number((rows[0] as { id: string }).id);
    },

    async updateStatus(id, status, sentAt) {
      await pool.query('UPDATE quotes SET status = $2, sent_at = $3 WHERE id = $1', [
        id,
        status,
        sentAt,
      ]);
    },
  };
}
