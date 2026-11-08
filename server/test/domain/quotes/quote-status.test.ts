import { describe, it, expect } from 'vitest';
import { InvalidStatusTransitionError } from '../../../src/errors.js';
import {
  ALLOWED_TRANSITIONS,
  QUOTE_STATUSES,
  assertTransition,
} from '../../../src/domain/quotes/quote-status.js';

describe('assertTransition', () => {
  const cases = QUOTE_STATUSES.flatMap((from) => QUOTE_STATUSES.map((to) => ({ from, to })));

  it.each(cases)('$from -> $to follows the allowed transitions table', ({ from, to }) => {
    const allowed = ALLOWED_TRANSITIONS[from].includes(to);

    if (allowed) {
      expect(() => assertTransition(from, to)).not.toThrow();
    } else {
      expect(() => assertTransition(from, to)).toThrow(InvalidStatusTransitionError);
    }
  });

  it('reports both statuses in the Portuguese message with status 422', () => {
    expect.assertions(2);
    try {
      assertTransition('won', 'sent');
    } catch (error) {
      const e = error as InvalidStatusTransitionError;
      expect(e.status).toBe(422);
      expect(e.detail).toBe('Transição de status não permitida: de won para sent');
    }
  });
});

describe('ALLOWED_TRANSITIONS', () => {
  it('matches the rules table', () => {
    expect(ALLOWED_TRANSITIONS).toEqual({
      draft: ['sent'],
      sent: ['negotiating', 'no_response', 'won', 'lost'],
      negotiating: ['no_response', 'won', 'lost'],
      no_response: ['negotiating', 'won', 'lost'],
      won: [],
      lost: [],
    });
  });
});
