import { describe, expect, it } from 'vitest';
import { clampPage, pageCount, pageRange, toOffset } from '../src/pagination';

describe('pageCount', () => {
  it.each([
    [0, 1],
    [20, 1],
    [21, 2],
  ])('counts %i items as %i page(s)', (total, expected) => {
    expect(pageCount(total, 20)).toBe(expected);
  });
});

describe('toOffset', () => {
  it('skips the items of the previous pages', () => {
    expect(toOffset(1, 20)).toBe(0);
    expect(toOffset(3, 20)).toBe(40);
  });
});

describe('pageRange', () => {
  it('spans a full first page', () => {
    expect(pageRange(1, 45, 20)).toEqual({ from: 1, to: 20 });
  });

  it('ends at the total on a partial last page', () => {
    expect(pageRange(3, 45, 20)).toEqual({ from: 41, to: 45 });
  });

  it('is zero to zero for an empty list', () => {
    expect(pageRange(1, 0, 20)).toEqual({ from: 0, to: 0 });
  });
});

describe('clampPage', () => {
  it('moves back to the last page after the list shrinks', () => {
    expect(clampPage(3, 40, 20)).toBe(2);
  });

  it('keeps a page that still exists', () => {
    expect(clampPage(2, 40, 20)).toBe(2);
  });

  it('falls back to page 1 when the list is empty', () => {
    expect(clampPage(2, 0, 20)).toBe(1);
  });
});
