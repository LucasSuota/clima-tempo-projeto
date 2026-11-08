import type { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { clearTables, createTestPool, resetTestSchema } from '../helpers/test-database.js';

let pool: Pool;

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

describe('GET /api/owners', () => {
  it('lists owners ordered by name with the total and numeric ids', async () => {
    await pool.query(
      "INSERT INTO owners (name, role) VALUES ('Carla Dias', 'Vendedora'), ('Alberto Lima', 'Gerente')",
    );

    const response = await request(createApp({ pool })).get('/api/owners');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [
        { id: 2, name: 'Alberto Lima', role: 'Gerente' },
        { id: 1, name: 'Carla Dias', role: 'Vendedora' },
      ],
      total: 2,
    });
  });

  it('answers 500 in the standard format, without leaking details, when the database fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failingPool = {
      query: () => Promise.reject(new Error('connect ECONNREFUSED 10.0.0.1:5432')),
    } as unknown as Pool;

    const response = await request(createApp({ pool: failingPool })).get('/api/owners');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ detail: 'Erro interno do servidor', errors: [] });
    expect(response.text).not.toContain('ECONNREFUSED');
  });
});

describe('POST /api/owners', () => {
  it('creates an owner with trimmed text and stores it', async () => {
    const response = await request(createApp({ pool }))
      .post('/api/owners')
      .send({ name: '  Alberto Lima ', role: ' Gerente ' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 1, name: 'Alberto Lima', role: 'Gerente' });
    const { rows } = await pool.query('SELECT name, role FROM owners');
    expect(rows).toEqual([{ name: 'Alberto Lima', role: 'Gerente' }]);
  });

  it('answers 422 with field errors and stores nothing when the input is invalid', async () => {
    const response = await request(createApp({ pool })).post('/api/owners').send({ name: '   ' });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      detail: 'Dados inválidos',
      errors: [
        { field: 'name', message: 'Obrigatório' },
        { field: 'role', message: 'Obrigatório' },
      ],
    });
    const { rows } = await pool.query('SELECT id FROM owners');
    expect(rows).toEqual([]);
  });
});
