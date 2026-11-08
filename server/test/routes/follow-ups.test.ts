import type { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { insertClient, insertFollowUp, insertOwner, insertQuote } from '../helpers/fixtures.js';
import { clearTables, createTestPool, resetTestSchema } from '../helpers/test-database.js';

let pool: Pool;

const app = () =>
  createApp({ pool, staleDays: 7, now: () => new Date('2026-03-15T12:00:00-03:00') });

async function createQuoteWith(status: string, sentAt: string | null): Promise<number> {
  const clientId = await insertClient(pool);
  const ownerId = await insertOwner(pool);
  return insertQuote(pool, { clientId, ownerId, status, sentAt });
}

beforeAll(async () => {
  pool = createTestPool();
  await resetTestSchema(pool);
});

beforeEach(async () => {
  await clearTables(pool);
});

afterAll(async () => {
  await pool.end();
});

describe('GET /api/quotes/:id/follow-ups', () => {
  it('lists follow-ups from the most recent contact to the oldest, with the total', async () => {
    const quoteId = await createQuoteWith('sent', '2026-03-01');
    await insertFollowUp(pool, quoteId, '2026-03-05', 'Ligação');
    await insertFollowUp(pool, quoteId, '2026-03-10');

    const response = await request(app()).get(`/api/quotes/${quoteId}/follow-ups`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [
        { id: 2, quoteId, contactedAt: '2026-03-10', description: null },
        { id: 1, quoteId, contactedAt: '2026-03-05', description: 'Ligação' },
      ],
      total: 2,
    });
  });

  it('paginates follow-ups keeping the total of that quote', async () => {
    const quoteId = await createQuoteWith('sent', '2026-03-01');
    await insertFollowUp(pool, quoteId, '2026-03-05', 'Ligação');
    await insertFollowUp(pool, quoteId, '2026-03-10');
    await insertFollowUp(pool, quoteId, '2026-03-12');
    const otherQuoteId = await createQuoteWith('sent', '2026-03-01');
    await insertFollowUp(pool, otherQuoteId, '2026-03-11');

    const response = await request(app()).get(`/api/quotes/${quoteId}/follow-ups?limit=1&offset=1`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [{ id: 2, quoteId, contactedAt: '2026-03-10', description: null }],
      total: 3,
    });
  });

  it('answers 404 when the quote does not exist', async () => {
    const response = await request(app()).get('/api/quotes/999/follow-ups');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ detail: 'Orçamento não encontrado', errors: [] });
  });
});

describe('POST /api/quotes/:id/follow-ups', () => {
  it('records a follow-up dated today and leaves the quote status unchanged', async () => {
    const quoteId = await createQuoteWith('sent', '2026-03-01');

    const response = await request(app())
      .post(`/api/quotes/${quoteId}/follow-ups`)
      .send({ description: '  Cliente pediu prazo  ' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 1,
      quoteId,
      contactedAt: '2026-03-15',
      description: 'Cliente pediu prazo',
    });
    const { rows } = await pool.query('SELECT status FROM quotes WHERE id = $1', [quoteId]);
    expect(rows).toEqual([{ status: 'sent' }]);
  });

  it('answers 422 for a draft quote', async () => {
    const quoteId = await createQuoteWith('draft', null);

    const response = await request(app()).post(`/api/quotes/${quoteId}/follow-ups`).send({});

    expect(response.status).toBe(422);
    expect(response.body.detail).toBe('Não é possível registrar contato em orçamento em rascunho');
  });

  it('answers 404 when the quote does not exist', async () => {
    const response = await request(app()).post('/api/quotes/999/follow-ups').send({});

    expect(response.status).toBe(404);
  });
});
