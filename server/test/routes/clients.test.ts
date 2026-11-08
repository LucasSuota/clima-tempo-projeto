import type { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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

describe('GET /api/clients', () => {
  it('lists clients ordered by name with the total, numeric ids and nulls preserved', async () => {
    await pool.query(
      "INSERT INTO clients (name, email, phone) VALUES ('Carla Dias', NULL, NULL), ('Alberto Lima', 'alberto@example.com', '11900000001')",
    );

    const response = await request(createApp({ pool })).get('/api/clients');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [
        { id: 2, name: 'Alberto Lima', email: 'alberto@example.com', phone: '11900000001' },
        { id: 1, name: 'Carla Dias', email: null, phone: null },
      ],
      total: 2,
    });
  });
});

describe('POST /api/clients', () => {
  it('creates a client normalizing name, e-mail and phone, and stores it', async () => {
    const response = await request(createApp({ pool }))
      .post('/api/clients')
      .send({ name: '  Alberto Lima ', email: '  Alberto@Example.COM ', phone: '(11) 90000-0001' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 1,
      name: 'Alberto Lima',
      email: 'alberto@example.com',
      phone: '11900000001',
    });
    const { rows } = await pool.query('SELECT name, email, phone FROM clients');
    expect(rows).toEqual([
      { name: 'Alberto Lima', email: 'alberto@example.com', phone: '11900000001' },
    ]);
  });

  it('stores null when e-mail and phone are absent or blank', async () => {
    const app = createApp({ pool });

    const absent = await request(app).post('/api/clients').send({ name: 'Ana Souza' });
    const blank = await request(app)
      .post('/api/clients')
      .send({ name: 'Bruno Lima', email: '  ', phone: '' });

    expect(absent.status).toBe(201);
    expect(blank.status).toBe(201);
    const { rows } = await pool.query('SELECT email, phone FROM clients');
    expect(rows).toEqual([
      { email: null, phone: null },
      { email: null, phone: null },
    ]);
  });

  it('answers 422 with field errors and stores nothing when the input is invalid', async () => {
    const response = await request(createApp({ pool }))
      .post('/api/clients')
      .send({ name: '   ', email: 'invalido' });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      detail: 'Dados inválidos',
      errors: [
        { field: 'name', message: 'Obrigatório' },
        { field: 'email', message: 'E-mail inválido' },
      ],
    });
    const { rows } = await pool.query('SELECT id FROM clients');
    expect(rows).toEqual([]);
  });

  it.each([
    {
      case: 'e-mail differing only by case',
      body: { name: 'Outra Pessoa', email: 'ANA@example.com' },
      error: { field: 'email', message: 'E-mail já cadastrado' },
    },
    {
      case: 'phone differing only by mask',
      body: { name: 'Outra Pessoa', phone: '11 90000-0001' },
      error: { field: 'phone', message: 'Telefone já cadastrado' },
    },
  ])('answers 422 on a duplicate $case', async ({ body, error }) => {
    await pool.query(
      "INSERT INTO clients (name, email, phone) VALUES ('Ana Souza', 'ana@example.com', '11900000001')",
    );

    const response = await request(createApp({ pool })).post('/api/clients').send(body);

    expect(response.status).toBe(422);
    expect(response.body).toEqual({ detail: 'Dados inválidos', errors: [error] });
    const { rows } = await pool.query('SELECT id FROM clients');
    expect(rows).toHaveLength(1);
  });
});
