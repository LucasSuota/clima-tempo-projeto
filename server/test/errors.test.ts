import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { DomainError, ValidationError, errorHandler, notFoundHandler } from '../src/errors.js';

class TeapotError extends DomainError {
  constructor() {
    super('Sou um bule', 418);
  }
}

function buildApp(setup: (app: express.Express) => void) {
  const app = express();
  app.use(express.json());
  setup(app);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('errorHandler', () => {
  it('translates a DomainError into its status and message', async () => {
    const app = buildApp((a) =>
      a.get('/boom', () => {
        throw new TeapotError();
      }),
    );

    const response = await request(app).get('/boom');

    expect(response.status).toBe(418);
    expect(response.body).toEqual({ detail: 'Sou um bule', errors: [] });
  });

  it('answers 422 with the field errors of a ValidationError', async () => {
    const app = buildApp((a) =>
      a.get('/boom', () => {
        throw new ValidationError([{ field: 'amount', message: 'Deve ser maior que zero' }]);
      }),
    );

    const response = await request(app).get('/boom');

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      detail: 'Dados inválidos',
      errors: [{ field: 'amount', message: 'Deve ser maior que zero' }],
    });
  });

  it('answers 422 with the failing fields when zod rejects the input', async () => {
    const schema = z.object({ amount: z.number() });
    const app = buildApp((a) =>
      a.post('/boom', (req) => {
        schema.parse(req.body);
      }),
    );

    const response = await request(app).post('/boom').send({ amount: 'abc' });

    expect(response.status).toBe(422);
    expect(response.body.detail).toBe('Dados inválidos');
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].field).toBe('amount');
  });

  it('answers 422 when the request body is malformed JSON', async () => {
    const app = buildApp((a) => a.post('/echo', (_req, res) => res.json({ ok: true })));

    const response = await request(app)
      .post('/echo')
      .set('Content-Type', 'application/json')
      .send('{ not json');

    expect(response.status).toBe(422);
    expect(response.body).toEqual({ detail: 'Dados inválidos', errors: [] });
  });

  it('answers 500 without leaking the internal message or stack', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = buildApp((a) =>
      a.get('/boom', () => {
        throw new Error('password=secret leaked');
      }),
    );

    const response = await request(app).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ detail: 'Erro interno do servidor', errors: [] });
    expect(response.text).not.toContain('secret');
  });
});

describe('notFoundHandler', () => {
  it('answers 404 in the standard error format', async () => {
    const app = buildApp(() => {});

    const response = await request(app).get('/nowhere');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ detail: 'Recurso não encontrado', errors: [] });
  });
});
