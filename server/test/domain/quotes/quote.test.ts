import { describe, it, expect } from 'vitest';
import { InvalidStatusTransitionError, ValidationError } from '../../../src/errors.js';
import {
  changeStatus,
  validateNewQuote,
  validateQuoteEdit,
} from '../../../src/domain/quotes/quote.js';

const today = '2026-03-10';

function fieldsOf(fn: () => void): string[] {
  try {
    fn();
  } catch (error) {
    return (error as ValidationError).errors.map((e) => e.field);
  }
  return [];
}

describe('validateNewQuote', () => {
  it('accepts a sent quote with a past sentAt', () => {
    expect(() =>
      validateNewQuote({ total: 100, status: 'sent', sentAt: '2026-03-01' }, today),
    ).not.toThrow();
  });

  it('accepts a sentAt equal to today', () => {
    expect(() =>
      validateNewQuote({ total: 100, status: 'sent', sentAt: today }, today),
    ).not.toThrow();
  });

  it('accepts a draft without sentAt', () => {
    expect(() =>
      validateNewQuote({ total: 0.01, status: 'draft', sentAt: null }, today),
    ).not.toThrow();
  });

  it.each([0, -5, Number.NaN])('rejects total %s', (total) => {
    expect(
      fieldsOf(() => validateNewQuote({ total, status: 'draft', sentAt: null }, today)),
    ).toEqual(['total']);
  });

  it('rejects a future sentAt', () => {
    const fields = fieldsOf(() =>
      validateNewQuote({ total: 100, status: 'sent', sentAt: '2026-03-11' }, today),
    );

    expect(fields).toEqual(['sentAt']);
  });

  it('rejects a sent quote without sentAt', () => {
    const fields = fieldsOf(() =>
      validateNewQuote({ total: 100, status: 'sent', sentAt: null }, today),
    );

    expect(fields).toEqual(['sentAt']);
  });

  it('rejects a draft with sentAt', () => {
    const fields = fieldsOf(() =>
      validateNewQuote({ total: 100, status: 'draft', sentAt: '2026-03-01' }, today),
    );

    expect(fields).toEqual(['sentAt']);
  });

  it('collects every error in one ValidationError', () => {
    const fields = fieldsOf(() =>
      validateNewQuote({ total: 0, status: 'sent', sentAt: null }, today),
    );

    expect(fields).toEqual(['total', 'sentAt']);
  });
});

describe('validateQuoteEdit', () => {
  it('accepts an edit without total', () => {
    expect(() => validateQuoteEdit({})).not.toThrow();
  });

  it('accepts the smallest positive total', () => {
    expect(() => validateQuoteEdit({ total: 0.01 })).not.toThrow();
  });

  it.each([0, -5, Number.NaN])('rejects total %s', (total) => {
    expect(fieldsOf(() => validateQuoteEdit({ total }))).toEqual(['total']);
  });
});

describe('changeStatus', () => {
  it('sends a draft when sentAt is given', () => {
    const result = changeStatus({ current: 'draft', target: 'sent', sentAt: '2026-03-10' }, today);

    expect(result).toEqual({ status: 'sent', sentAt: '2026-03-10' });
  });

  it('requires sentAt to move to sent', () => {
    expect(() => changeStatus({ current: 'draft', target: 'sent', sentAt: null }, today)).toThrow(
      ValidationError,
    );
  });

  it('rejects a future sentAt when moving to sent', () => {
    expect(() =>
      changeStatus({ current: 'draft', target: 'sent', sentAt: '2026-03-11' }, today),
    ).toThrow(ValidationError);
  });

  it('keeps sentAt on other transitions', () => {
    const result = changeStatus({ current: 'sent', target: 'won', sentAt: '2026-03-01' }, today);

    expect(result).toEqual({ status: 'won', sentAt: '2026-03-01' });
  });

  it('rejects a transition that is not allowed', () => {
    expect(() =>
      changeStatus({ current: 'lost', target: 'negotiating', sentAt: '2026-03-01' }, today),
    ).toThrow(InvalidStatusTransitionError);
  });
});
