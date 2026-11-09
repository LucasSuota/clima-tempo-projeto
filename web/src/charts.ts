import type { Indicators, Quote } from './api/types';
import { CRITICAL_DAYS_WITHOUT_CONTACT } from './format';

// Presentation only: these helpers turn numbers the API already computed into chart
// proportions. They never decide whether a quote is stale (AGENTS.md §5.4).

/** Fraction `part / whole` clamped to 0..1, or `null` when there is no whole to divide by. */
export function shareOf(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.min(Math.max(part / whole, 0), 1);
}

export interface OpenTotalSplit {
  stale: number;
  current: number;
  /** `null` when nothing is open, so the bar shows "no data" instead of dividing by zero. */
  staleShare: number | null;
}

export function splitOpenTotal({ openTotal, staleTotal }: Indicators): OpenTotalSplit {
  const stale = Math.min(staleTotal, openTotal);
  return {
    stale,
    current: Math.max(openTotal - stale, 0),
    staleShare: shareOf(stale, openTotal),
  };
}

export interface AgingBand {
  label: string;
  count: number;
  total: number;
}

// The last band starts where the table already paints days in the critical tone.
const MIDDLE_BAND_START = 15;

/** Groups the stale queue (already filtered by the API) by days without contact. */
export function groupQueueByAge(items: Quote[]): AgingBand[] {
  const limits = [
    { minDays: 0, label: `Até ${MIDDLE_BAND_START - 1} dias` },
    {
      minDays: MIDDLE_BAND_START,
      label: `${MIDDLE_BAND_START} a ${CRITICAL_DAYS_WITHOUT_CONTACT - 1} dias`,
    },
    {
      minDays: CRITICAL_DAYS_WITHOUT_CONTACT,
      label: `${CRITICAL_DAYS_WITHOUT_CONTACT} dias ou mais`,
    },
  ];

  return limits.map(({ minDays, label }, index) => {
    const nextMinDays = limits[index + 1]?.minDays ?? Infinity;
    const inBand = items.filter((item) => {
      const days = item.daysWithoutContact ?? 0;
      return days >= minDays && days < nextMinDays;
    });
    return {
      label,
      count: inBand.length,
      total: inBand.reduce((sum, item) => sum + item.total, 0),
    };
  });
}
