import { describe, it, expect } from 'vitest';
import {
  effectiveStatus,
  evaluateStaleness,
  getLastContact,
} from '../../../src/domain/quotes/stale-quote.js';
import { type QuoteStatus } from '../../../src/domain/quotes/quote-status.js';

const X = 7;
const quote = (
  status: QuoteStatus,
  followUpDates: string[] = [],
  sentAt: string | null = '2026-03-01',
) => ({
  status,
  sentAt,
  followUpDates,
});

describe('evaluateStaleness', () => {
  it('is not stale one day before the limit', () => {
    expect(evaluateStaleness(quote('sent'), '2026-03-07', X)).toEqual({
      isStale: false,
      daysWithoutContact: 6,
    });
  });

  it('is stale exactly at the limit', () => {
    expect(evaluateStaleness(quote('sent'), '2026-03-08', X)).toEqual({
      isStale: true,
      daysWithoutContact: 7,
    });
  });

  it('counts from the latest follow-up, resetting the count', () => {
    const result = evaluateStaleness(quote('sent', ['2026-03-07']), '2026-03-08', X);

    expect(result).toEqual({ isStale: false, daysWithoutContact: 1 });
  });

  it('uses the greatest of several out-of-order follow-ups', () => {
    const result = evaluateStaleness(
      quote('negotiating', ['2026-03-05', '2026-03-02', '2026-03-04']),
      '2026-03-10',
      X,
    );

    expect(result).toEqual({ isStale: false, daysWithoutContact: 5 });
  });

  it('crosses month and year boundaries', () => {
    const result = evaluateStaleness(quote('no_response', [], '2025-12-28'), '2026-01-04', X);

    expect(result).toEqual({ isStale: true, daysWithoutContact: 7 });
  });

  it.each(['draft', 'won', 'lost'] as const)('never marks %s as stale', (status) => {
    const result = evaluateStaleness(
      quote(status, [], status === 'draft' ? null : '2026-01-01'),
      '2026-03-10',
      X,
    );

    expect(result).toEqual({ isStale: false, daysWithoutContact: null });
  });
});

describe('getLastContact', () => {
  it('falls back to sentAt without follow-ups', () => {
    expect(getLastContact('2026-03-01', [])).toBe('2026-03-01');
  });
});

describe('effectiveStatus', () => {
  it('derives no_response from a stale sent quote', () => {
    expect(effectiveStatus(quote('sent'), '2026-03-08', X)).toBe('no_response');
  });

  it('keeps sent when it is not stale', () => {
    expect(effectiveStatus(quote('sent'), '2026-03-07', X)).toBe('sent');
  });

  it('keeps a stale negotiating quote as negotiating', () => {
    expect(effectiveStatus(quote('negotiating'), '2026-03-20', X)).toBe('negotiating');
  });

  it('keeps a stored no_response as is', () => {
    expect(effectiveStatus(quote('no_response', ['2026-03-09']), '2026-03-10', X)).toBe(
      'no_response',
    );
  });

  it('keeps final statuses and draft', () => {
    expect(effectiveStatus(quote('won'), '2026-03-20', X)).toBe('won');
    expect(effectiveStatus(quote('draft', [], null), '2026-03-20', X)).toBe('draft');
  });
});
