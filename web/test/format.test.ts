import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, formatDays, formatPercent } from '../src/format';

// Intl uses a no-break space (U+00A0) between "R$" and the number.
const NBSP = ' ';

describe('formatCurrency', () => {
  it('formats thousands and cents in Brazilian reais', () => {
    expect(formatCurrency(1500)).toBe(`R$${NBSP}1.500,00`);
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe(`R$${NBSP}0,00`);
  });
});

describe('formatDate', () => {
  it('converts YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(formatDate('2026-03-01')).toBe('01/03/2026');
  });

  it('keeps the calendar day on the last day of the year, regardless of the timezone', () => {
    expect(formatDate('2026-12-31')).toBe('31/12/2026');
  });

  it('shows a dash when there is no date', () => {
    expect(formatDate(null)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('formats a whole percentage', () => {
    expect(formatPercent(0.75)).toBe('75%');
  });

  it('keeps one decimal place with a comma', () => {
    expect(formatPercent(0.6667)).toBe('66,7%');
  });

  it('formats the limits 0 and 1', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(1)).toBe('100%');
  });

  it('says there is no data when the rate is null', () => {
    expect(formatPercent(null)).toBe('Sem dados');
  });
});

describe('formatDays', () => {
  it('uses the plural for zero and many days', () => {
    expect(formatDays(0)).toBe('0 dias');
    expect(formatDays(7)).toBe('7 dias');
  });

  it('uses the singular for one day', () => {
    expect(formatDays(1)).toBe('1 dia');
  });
});
