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

describe('GET /api/indicators', () => {
  it('sums open and stale totals in SQL and matches the stale queue', async () => {
    const clientId = await insertClient(pool);
    const ownerId = await insertOwner(pool);
    const quote = (total: number, status: string, sentAt: string | null = null) =>
      insertQuote(pool, { clientId, ownerId, total, status, sentAt });
    // Cents on purpose: summing these as floats would not give an exact result.
    await quote(1000.1, 'sent', '2026-03-01');
    await quote(2000.2, 'negotiating', '2026-03-05');
    await quote(500.05, 'no_response', '2026-03-08');
    await quote(300, 'sent', '2026-03-09');
    const contactedId = await quote(400, 'sent', '2026-03-01');
    await insertFollowUp(pool, contactedId, '2026-03-12');
    await quote(999, 'draft');
    await quote(100, 'won', '2026-02-01');
    await quote(100, 'won', '2026-02-01');
    await quote(100, 'won', '2026-02-01');
    await quote(100, 'lost', '2026-02-01');

    const response = await request(app()).get('/api/indicators');
    const queue = await request(app()).get('/api/quotes/stale');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      openTotal: 4200.35,
      staleTotal: 3500.35,
      conversionRate: 0.75,
    });
    const queueCents = queue.body.items.reduce(
      (sum: number, item: { total: number }) => sum + Math.round(item.total * 100),
      0,
    );
    expect(queue.body.total).toBe(3);
    expect(queueCents / 100).toBe(response.body.staleTotal);
  });

  it('answers a null conversion rate when nothing was won or lost', async () => {
    const clientId = await insertClient(pool);
    const ownerId = await insertOwner(pool);
    await insertQuote(pool, {
      clientId,
      ownerId,
      total: 300,
      status: 'sent',
      sentAt: '2026-03-09',
    });

    const response = await request(app()).get('/api/indicators');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ openTotal: 300, staleTotal: 0, conversionRate: null });
  });
});
