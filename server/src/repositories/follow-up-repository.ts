import type { Pool } from 'pg';
import type { FollowUp } from '../domain/follow-ups/follow-up.js';
import type { CalendarDate } from '../domain/shared/calendar-date.js';

export interface NewFollowUpRecord {
  quoteId: number;
  contactedAt: CalendarDate;
  description: string | null;
}

export interface FollowUpRepository {
  findByQuoteId(quoteId: number): Promise<FollowUp[]>;
  insert(followUp: NewFollowUpRecord): Promise<FollowUp>;
}

// pg returns bigint columns as strings.
interface FollowUpRow {
  id: string;
  quote_id: string;
  contacted_at: string;
  description: string | null;
}

function toFollowUp(row: FollowUpRow): FollowUp {
  return {
    id: Number(row.id),
    quoteId: Number(row.quote_id),
    contactedAt: row.contacted_at,
    description: row.description,
  };
}

const COLUMNS = "id, quote_id, to_char(contacted_at, 'YYYY-MM-DD') AS contacted_at, description";

export function createFollowUpRepository(pool: Pool): FollowUpRepository {
  return {
    async findByQuoteId(quoteId) {
      const { rows } = await pool.query<FollowUpRow>(
        `SELECT ${COLUMNS} FROM follow_ups WHERE quote_id = $1 ORDER BY contacted_at DESC, id DESC`,
        [quoteId],
      );
      return rows.map(toFollowUp);
    },

    async insert(followUp) {
      const { rows } = await pool.query<FollowUpRow>(
        `INSERT INTO follow_ups (quote_id, contacted_at, description)
         VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
        [followUp.quoteId, followUp.contactedAt, followUp.description],
      );
      return toFollowUp(rows[0] as FollowUpRow);
    },
  };
}
