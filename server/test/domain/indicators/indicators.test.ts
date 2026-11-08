import { describe, it, expect } from 'vitest';
import { conversionRate } from '../../../src/domain/indicators/indicators.js';

describe('conversionRate', () => {
  it('is won over won plus lost as a fraction', () => {
    expect(conversionRate(3, 1)).toBe(0.75);
  });

  it('is null when nothing was won or lost', () => {
    expect(conversionRate(0, 0)).toBeNull();
  });

  it('is zero when only lost quotes exist', () => {
    expect(conversionRate(0, 2)).toBe(0);
  });
});
