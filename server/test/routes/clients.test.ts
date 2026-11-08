import type { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { insertClient, insertOwner, insertQuote } from '../helpers/fixtures.js';
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

describe('PUT /api/clients/:id', () => {
  it('replaces the client normalizing the input, and accepts its own e-mail and phone', async () => {
    const app = createApp({ pool });
    await pool.query(
      "INSERT INTO clients (name, email, phone) VALUES ('Ana Souza', 'ana@example.com', '11900000001')",
    );

    const response = await request(app)
      .put('/api/clients/1')
      .send({ name: '  Ana Souza Lima ', email: 'ANA@example.com', phone: '(11) 90000-0001' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      name: 'Ana Souza Lima',
      email: 'ana@example.com',
      phone: '11900000001',
    });
    const { rows } = await pool.query('SELECT name, email, phone FROM clients');
    expect(rows).toEqual([
      { name: 'Ana Souza Lima', email: 'ana@example.com', phone: '11900000001' },
    ]);
  });

  it('clears e-mail and phone when they are absent from the body', async () => {
    await pool.query(
      "INSERT INTO clients (name, email, phone) VALUES ('Ana Souza', 'ana@example.com', '11900000001')",
    );

    const response = await request(createApp({ pool })).put('/api/clients/1').send({ name: 'Ana' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 1, name: 'Ana', email: null, phone: null });
    const { rows } = await pool.query('SELECT email, phone FROM clients');
    expect(rows).toEqual([{ email: null, phone: null }]);
  });

  it.each([
    {
      case: 'e-mail',
      body: { name: 'Bruno Lima', email: 'ANA@example.com' },
      error: { field: 'email', message: 'E-mail já cadastrado' },
    },
    {
      case: 'phone',
      body: { name: 'Bruno Lima', phone: '11 90000-0001' },
      error: { field: 'phone', message: 'Telefone já cadastrado' },
    },
  ])(
    'answers 422 and keeps the client when the $case belongs to another one',
    async ({ body, error }) => {
      await pool.query(
        "INSERT INTO clients (name, email, phone) VALUES ('Ana Souza', 'ana@example.com', '11900000001'), ('Bruno', NULL, NULL)",
      );

      const response = await request(createApp({ pool })).put('/api/clients/2').send(body);

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ detail: 'Dados inválidos', errors: [error] });
      const { rows } = await pool.query('SELECT name FROM clients WHERE id = 2');
      expect(rows).toEqual([{ name: 'Bruno' }]);
    },
  );

  it.each(['999', 'abc'])('answers 404 for the id %s', async (id) => {
    const response = await request(createApp({ pool }))
      .put(`/api/clients/${id}`)
      .send({ name: 'Ana' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ detail: 'Cliente não encontrado', errors: [] });
  });
});

describe('DELETE /api/clients/:id', () => {
  it('removes the client and answers 204 without a body', async () => {
    const clientId = await insertClient(pool);

    const response = await request(createApp({ pool })).delete(`/api/clients/${clientId}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
    const { rows } = await pool.query('SELECT id FROM clients');
    expect(rows).toEqual([]);
  });

  it('answers 422 and keeps client and quote when the client has quotes', async () => {
    const clientId = await insertClient(pool);
    const ownerId = await insertOwner(pool);
    await insertQuote(pool, { clientId, ownerId });

    const response = await request(createApp({ pool })).delete(`/api/clients/${clientId}`);

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      detail: 'Não é possível excluir um cliente que possui orçamentos',
      errors: [],
    });
    const clients = await pool.query('SELECT id FROM clients');
    const quotes = await pool.query('SELECT id FROM quotes');
    expect(clients.rows).toHaveLength(1);
    expect(quotes.rows).toHaveLength(1);
  });

  it('answers 404 when the client does not exist', async () => {
    const response = await request(createApp({ pool })).delete('/api/clients/999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ detail: 'Cliente não encontrado', errors: [] });
  });
});
