import type { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { insertClient, insertFollowUp, insertOwner, insertQuote } from '../helpers/fixtures.js';
import { clearTables, createTestPool, resetTestSchema } from '../helpers/test-database.js';

let pool: Pool;

const app = () =>
  createApp({ pool, staleDays: 7, now: () => new Date('2026-03-15T12:00:00-03:00') });

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

describe('GET /api/quotes', () => {
  it('lists quotes with client, owner and calculated fields, newest first', async () => {
    const clientId = await insertClient(pool);
    const ownerId = await insertOwner(pool);
    await insertQuote(pool, { clientId, ownerId, description: 'Rascunho', status: 'draft' });
    const staleId = await insertQuote(pool, {
      clientId,
      ownerId,
      description: 'Parado',
      total: 2850.5,
      status: 'sent',
      sentAt: '2026-03-01',
    });
    const recentId = await insertQuote(pool, {
      clientId,
      ownerId,
      description: 'Recente',
      status: 'sent',
      sentAt: '2026-03-01',
    });
    await insertFollowUp(pool, recentId, '2026-03-12');

    const response = await request(app()).get('/api/quotes');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(3);
    const person = {
      client: { id: clientId, name: 'Ana Souza' },
      owner: { id: ownerId, name: 'Marina Costa', role: 'Vendedora' },
    };
    expect(response.body.items).toEqual([
      {
        id: recentId,
        description: 'Recente',
        total: 1500,
        status: 'sent',
        sentAt: '2026-03-01',
        isStale: false,
        daysWithoutContact: 3,
        ...person,
      },
      {
        id: staleId,
        description: 'Parado',
        total: 2850.5,
        status: 'no_response',
        sentAt: '2026-03-01',
        isStale: true,
        daysWithoutContact: 14,
        ...person,
      },
      {
        id: expect.any(Number),
        description: 'Rascunho',
        total: 1500,
        status: 'draft',
        sentAt: null,
        isStale: false,
        daysWithoutContact: null,
        ...person,
      },
    ]);
  });
});

describe('GET /api/quotes/stale', () => {
  it('lists only stale quotes ordered by days without contact, then total, then id', async () => {
    const clientId = await insertClient(pool);
    const ownerId = await insertOwner(pool);
    const stale = (description: string, total: number, status: string, sentAt: string) =>
      insertQuote(pool, { clientId, ownerId, description, total, status, sentAt });
    const sentLowId = await stale('A', 1000, 'sent', '2026-03-01');
    const sentHighId = await stale('B', 3000, 'sent', '2026-03-01');
    const negotiatingId = await stale('C', 500, 'negotiating', '2026-03-05');
    const noResponseId = await stale('D', 500, 'no_response', '2026-03-08');
    // Not in the queue: one day short of the limit, recent follow-up, draft and final status.
    await stale('Dentro do prazo', 500, 'sent', '2026-03-09');
    const contactedId = await stale('Com contato recente', 500, 'sent', '2026-03-01');
    await insertFollowUp(pool, contactedId, '2026-03-14');
    await insertQuote(pool, { clientId, ownerId, description: 'Rascunho', status: 'draft' });
    await stale('Ganho', 500, 'won', '2026-02-01');

    const response = await request(app()).get('/api/quotes/stale');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(4);
    const person = {
      client: { id: clientId, name: 'Ana Souza' },
      owner: { id: ownerId, name: 'Marina Costa', role: 'Vendedora' },
    };
    expect(response.body.items).toEqual([
      {
        id: sentHighId,
        description: 'B',
        total: 3000,
        status: 'no_response',
        sentAt: '2026-03-01',
        isStale: true,
        daysWithoutContact: 14,
        ...person,
      },
      {
        id: sentLowId,
        description: 'A',
        total: 1000,
        status: 'no_response',
        sentAt: '2026-03-01',
        isStale: true,
        daysWithoutContact: 14,
        ...person,
      },
      {
        id: negotiatingId,
        description: 'C',
        total: 500,
        status: 'negotiating',
        sentAt: '2026-03-05',
        isStale: true,
        daysWithoutContact: 10,
        ...person,
      },
      {
        id: noResponseId,
        description: 'D',
        total: 500,
        status: 'no_response',
        sentAt: '2026-03-08',
        isStale: true,
        daysWithoutContact: 7,
        ...person,
      },
    ]);
  });

  it('answers 200 with an empty list instead of treating "stale" as a quote id', async () => {
    const response = await request(app()).get('/api/quotes/stale');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], total: 0 });
  });
});

describe('GET /api/quotes/:id', () => {
  it('answers 404 for an unknown or malformed id', async () => {
    const unknown = await request(app()).get('/api/quotes/999');
    const malformed = await request(app()).get('/api/quotes/abc');

    for (const response of [unknown, malformed]) {
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ detail: 'Orçamento não encontrado', errors: [] });
    }
  });
});

describe('POST /api/quotes', () => {
  it('creates a draft quote when status and sentAt are omitted', async () => {
    const clientId = await insertClient(pool);
    const ownerId = await insertOwner(pool);

    const response = await request(app())
      .post('/api/quotes')
      .send({ clientId, ownerId, description: '  Instalação de split  ', total: 1500.5 });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      description: 'Instalação de split',
      total: 1500.5,
      status: 'draft',
      sentAt: null,
      client: { id: clientId },
      owner: { id: ownerId },
    });
  });

  it('answers 422 listing both the missing client and the missing owner', async () => {
    const response = await request(app())
      .post('/api/quotes')
      .send({ clientId: 999, ownerId: 888, description: 'Instalação', total: 100 });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      detail: 'Dados inválidos',
      errors: [
        { field: 'clientId', message: 'Cliente não encontrado' },
        { field: 'ownerId', message: 'Responsável não encontrado' },
      ],
    });
  });

  it('answers 422 when the total is not greater than zero', async () => {
    const response = await request(app())
      .post('/api/quotes')
      .send({ clientId: 1, ownerId: 1, description: 'Instalação', total: 0 });

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual([{ field: 'total', message: 'Deve ser maior que zero' }]);
  });
});

describe('PATCH /api/quotes/:id/status', () => {
  async function createQuoteWith(status: string, sentAt: string | null): Promise<number> {
    const clientId = await insertClient(pool);
    const ownerId = await insertOwner(pool);
    return insertQuote(pool, { clientId, ownerId, status, sentAt });
  }

  it('sends a draft quote with the given send date', async () => {
    const id = await createQuoteWith('draft', null);

    const response = await request(app())
      .patch(`/api/quotes/${id}/status`)
      .send({ status: 'sent', sentAt: '2026-03-10' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id,
      status: 'sent',
      sentAt: '2026-03-10',
      daysWithoutContact: 5,
    });
  });

  it('answers 422 for a transition out of a final status', async () => {
    const id = await createQuoteWith('won', '2026-03-01');

    const response = await request(app())
      .patch(`/api/quotes/${id}/status`)
      .send({ status: 'negotiating' });

    expect(response.status).toBe(422);
    expect(response.body.detail).toBe('Transição de status não permitida: de won para negotiating');
  });

  it('answers 422 when asking no_response on a stale sent quote, which already shows it', async () => {
    const id = await createQuoteWith('sent', '2026-03-01');

    const response = await request(app())
      .patch(`/api/quotes/${id}/status`)
      .send({ status: 'no_response' });

    expect(response.status).toBe(422);
  });

  it('accepts no_response on a sent quote that is not stale', async () => {
    const id = await createQuoteWith('sent', '2026-03-13');

    const response = await request(app())
      .patch(`/api/quotes/${id}/status`)
      .send({ status: 'no_response' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('no_response');
  });
});
