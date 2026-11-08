import type { Pool } from 'pg';
import type { QuoteStatus } from '../domain/quotes/quote-status.js';

export interface IndicatorTotals {
  openTotal: number;
  staleTotal: number;
  wonCount: number;
  lostCount: number;
}

export interface IndicatorRepository {
  getTotals(
    openStatuses: readonly QuoteStatus[],
    staleIds: readonly number[],
  ): Promise<IndicatorTotals>;
}

// pg returns NUMERIC and COUNT (bigint) as strings.
interface TotalsRow {
  open_total: string;
  stale_total: string;
  won_count: string;
  lost_count: string;
}

export function createIndicatorRepository(pool: Pool): IndicatorRepository {
  return {
    // Sums stay in SQL because it is exact for money (AGENTS.md §5.5). The stale ids come from
    // the domain rule, so the "stale" definition is not repeated here.
    async getTotals(openStatuses, staleIds) {
      const { rows } = await pool.query<TotalsRow>(
        `SELECT COALESCE(SUM(total) FILTER (WHERE status = ANY($1::text[])), 0) AS open_total,
                COALESCE(SUM(total) FILTER (WHERE id = ANY($2::bigint[])), 0) AS stale_total,
                COUNT(*) FILTER (WHERE status = 'won') AS won_count,
                COUNT(*) FILTER (WHERE status = 'lost') AS lost_count
           FROM quotes`,
        [openStatuses, staleIds],
      );
      const row = rows[0] as TotalsRow;
      return {
        openTotal: Number(row.open_total),
        staleTotal: Number(row.stale_total),
        wonCount: Number(row.won_count),
        lostCount: Number(row.lost_count),
      };
    },
  };
}
