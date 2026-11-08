import type { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { createPool } from '../../src/db.js';

const databaseUrlTest = process.env.DATABASE_URL_TEST;

let pool: Pool;

beforeAll(() => {
  // Never fall back to the dev database: API tests only talk to the test one (AGENTS.md §8).
  if (!databaseUrlTest) {
    throw new Error('DATABASE_URL_TEST is not set. Copy .env.example to .env and start the db.');
  }
  pool = createPool(databaseUrlTest);
});

afterAll(async () => {
  await pool.end();
});

describe('GET /api/health', () => {
  it('answers ok when the database connection works', async () => {
    const app = createApp({ pool });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('answers 500 in the standard format, without leaking details, when the database fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failingPool = {
      query: () => Promise.reject(new Error('connect ECONNREFUSED 10.0.0.1:5432')),
    } as unknown as Pool;
    const app = createApp({ pool: failingPool });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ detail: 'Erro interno do servidor', errors: [] });
    expect(response.text).not.toContain('ECONNREFUSED');
  });
});

describe('unknown routes', () => {
  it('answer 404 in the standard error format', async () => {
    const app = createApp({ pool });

    const response = await request(app).get('/api/nowhere');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ detail: 'Recurso não encontrado', errors: [] });
  });
});
