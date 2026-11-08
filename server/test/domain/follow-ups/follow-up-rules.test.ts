import { describe, it, expect } from 'vitest';
import { FollowUpNotAllowedError, ValidationError } from '../../../src/errors.js';
import { validateFollowUp } from '../../../src/domain/follow-ups/follow-up-rules.js';

const today = '2026-03-10';
const sent = { status: 'sent' as const, sentAt: '2026-03-01' };

describe('validateFollowUp', () => {
  it('accepts a contact between sentAt and today', () => {
    expect(() => validateFollowUp(sent, '2026-03-05', today)).not.toThrow();
  });

  it('accepts a contact on the sentAt day and on today', () => {
    expect(() => validateFollowUp(sent, '2026-03-01', today)).not.toThrow();
    expect(() => validateFollowUp(sent, today, today)).not.toThrow();
  });

  it('rejects a future contact', () => {
    expect(() => validateFollowUp(sent, '2026-03-11', today)).toThrow(ValidationError);
  });

  it('rejects a contact before sentAt, naming the field', () => {
    expect.assertions(2);
    try {
      validateFollowUp(sent, '2026-02-28', today);
    } catch (error) {
      const e = error as ValidationError;
      expect(e.status).toBe(422);
      expect(e.errors).toEqual([
        { field: 'contactedAt', message: 'Não pode ser anterior ao envio' },
      ]);
    }
  });

  it('rejects any follow-up on a draft, before checking dates', () => {
    expect(() => validateFollowUp({ status: 'draft', sentAt: null }, '2030-01-01', today)).toThrow(
      FollowUpNotAllowedError,
    );
  });

  it.each(['won', 'lost'] as const)('accepts a follow-up on a %s quote', (status) => {
    expect(() =>
      validateFollowUp({ status, sentAt: '2026-03-01' }, '2026-03-05', today),
    ).not.toThrow();
  });
});
