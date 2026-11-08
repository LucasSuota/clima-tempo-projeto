import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCorsMiddleware } from '../../src/middlewares/cors.js';

const ALLOWED_ORIGIN = 'http://localhost:8080';

function buildApp(allowedOrigin: string | undefined) {
  const app = express();
  app.use(createCorsMiddleware(allowedOrigin));
  app.get('/ping', (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

describe('createCorsMiddleware', () => {
  it('echoes the allowed origin on a regular request', async () => {
    const app = buildApp(ALLOWED_ORIGIN);

    const response = await request(app).get('/ping').set('Origin', ALLOWED_ORIGIN);

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
    expect(response.headers.vary).toContain('Origin');
  });

  it('answers the preflight of the allowed origin with 204 and the allowed methods', async () => {
    const app = buildApp(ALLOWED_ORIGIN);

    const response = await request(app).options('/ping').set('Origin', ALLOWED_ORIGIN);

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
    expect(response.headers['access-control-allow-methods']).toBe('GET, POST, PATCH, OPTIONS');
  });

  it('does not add CORS headers for a different origin', async () => {
    const app = buildApp(ALLOWED_ORIGIN);

    const response = await request(app).get('/ping').set('Origin', 'http://evil.example');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('does not add CORS headers when no origin is configured', async () => {
    const app = buildApp(undefined);

    const response = await request(app).get('/ping').set('Origin', ALLOWED_ORIGIN);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
