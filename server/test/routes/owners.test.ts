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

  it('paginates with limit and offset keeping the full total', async () => {
    await pool.query(
      "INSERT INTO owners (name, role) VALUES ('Carla Dias', 'Vendedora'), ('Alberto Lima', 'Gerente'), ('Bruno Reis', 'Técnico')",
    );

    const page = await request(createApp({ pool })).get('/api/owners?limit=1&offset=1');
    const pastTheEnd = await request(createApp({ pool })).get('/api/owners?limit=10&offset=5');

    expect(page.status).toBe(200);
    expect(page.body).toEqual({
      items: [{ id: 3, name: 'Bruno Reis', role: 'Técnico' }],
      total: 3,
    });
    expect(pastTheEnd.status).toBe(200);
    expect(pastTheEnd.body).toEqual({ items: [], total: 3 });
  });

  it.each([
    ['limit=0', 'limit', 'Deve estar entre 1 e 100'],
    ['limit=101', 'limit', 'Deve estar entre 1 e 100'],
    ['limit=abc', 'limit', 'Limite inválido'],
    ['limit=', 'limit', 'Limite inválido'],
    ['limit=1&limit=2', 'limit', 'Limite inválido'],
    ['offset=-1', 'offset', 'Deslocamento inválido'],
    ['offset=1.5', 'offset', 'Deslocamento inválido'],
  ])('answers 422 for an invalid pagination query (%s)', async (query, field, message) => {
    const response = await request(createApp({ pool })).get(`/api/owners?${query}`);

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      detail: 'Dados inválidos',
      errors: [{ field, message }],
    });
  });

  it('answers 500 in the standard format, without leaking details, when the database fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failingPool = {
      query: () => Promise.reject(new Error('connect ECONNREFUSED 10.0.0.1:5432')),
    } as unknown as Pool;

    const response = await request(createApp({ pool: failingPool })).get('/api/owners');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ detail: 'Erro interno do servidor', errors: [] });
    expect(response.text).not.toContain('ECONNREFUSED');
    consoleError.mockRestore();
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
