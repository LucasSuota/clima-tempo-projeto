// Fraction between 0 and 1, or null when there is nothing to compare ("sem dados").
export function conversionRate(won: number, lost: number): number | null {
  const decided = won + lost;
  return decided === 0 ? null : won / decided;
}
