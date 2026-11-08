import { describe, it, expect } from 'vitest';
import {
  daysBetween,
  isCalendarDate,
  toCalendarDate,
} from '../../../src/domain/shared/calendar-date.js';

describe('toCalendarDate', () => {
  it('keeps the previous day just before midnight in Sao Paulo', () => {
    expect(toCalendarDate(new Date('2026-03-02T02:59:59Z'))).toBe('2026-03-01');
  });

  it('moves to the next day at midnight in Sao Paulo', () => {
    expect(toCalendarDate(new Date('2026-03-02T03:00:00Z'))).toBe('2026-03-02');
  });
});

describe('daysBetween', () => {
  it('counts days within a month', () => {
    expect(daysBetween('2026-03-01', '2026-03-08')).toBe(7);
  });

  it('counts across a month and year change', () => {
    expect(daysBetween('2025-12-30', '2026-01-02')).toBe(3);
  });

  it('counts the leap day of 2028', () => {
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
  });

  it('is negative when the target is earlier', () => {
    expect(daysBetween('2026-03-08', '2026-03-01')).toBe(-7);
  });
});

describe('isCalendarDate', () => {
  it('accepts a real date and the leap day', () => {
    expect(isCalendarDate('2026-03-01')).toBe(true);
    expect(isCalendarDate('2028-02-29')).toBe(true);
  });

  it.each(['2026-02-30', '2027-02-29', '2026-3-1', 'abc', ''])('rejects %s', (value) => {
    expect(isCalendarDate(value)).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isCalendarDate(20260301)).toBe(false);
  });
});
