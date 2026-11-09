import { describe, expect, it } from 'vitest';
import type { Quote } from '../src/api/types';
import { groupQueueByAge, shareOf, splitOpenTotal } from '../src/charts';

function staleQuote(id: number, daysWithoutContact: number, total: number): Quote {
  return {
    id,
    description: 'Instalação fictícia',
    total,
    status: 'sent',
    sentAt: '2026-01-01',
    isStale: true,
    daysWithoutContact,
    client: { id: 1, name: 'Cliente Teste' },
    owner: { id: 1, name: 'Responsável Teste', role: 'Vendedor' },
  };
}

describe('shareOf', () => {
  it('returns the fraction of the whole', () => {
    expect(shareOf(25, 100)).toBe(0.25);
  });

  it('returns null instead of dividing by zero', () => {
    expect(shareOf(0, 0)).toBeNull();
  });

  it('clamps a part larger than the whole to 1', () => {
    expect(shareOf(150, 100)).toBe(1);
  });
});

describe('splitOpenTotal', () => {
  it('splits the open total into stale and current amounts', () => {
    expect(splitOpenTotal({ openTotal: 1000, staleTotal: 250, conversionRate: null })).toEqual({
      stale: 250,
      current: 750,
      staleShare: 0.25,
    });
  });

  it('has no share when nothing is open', () => {
    expect(
      splitOpenTotal({ openTotal: 0, staleTotal: 0, conversionRate: null }).staleShare,
    ).toBeNull();
  });
});

describe('groupQueueByAge', () => {
  it('counts and sums the queue on the band limits', () => {
    const bands = groupQueueByAge([
      staleQuote(1, 14, 100),
      staleQuote(2, 15, 200),
      staleQuote(3, 29, 300),
      staleQuote(4, 30, 400),
    ]);

    expect(bands.map(({ count, total }) => ({ count, total }))).toEqual([
      { count: 1, total: 100 },
      { count: 2, total: 500 },
      { count: 1, total: 400 },
    ]);
  });
});
