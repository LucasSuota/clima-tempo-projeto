import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request, withPage } from '../../src/api/client';

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('request', () => {
  it('sends method, JSON body and Content-Type, and returns the response JSON', async () => {
    const fetchMock = stubFetch(Response.json({ id: 1, name: 'Ana' }, { status: 201 }));

    const result = await request<{ id: number }>('/owners', {
      method: 'POST',
      body: { name: 'Ana' },
    });

    expect(result).toEqual({ id: 1, name: 'Ana' });
    expect(fetchMock).toHaveBeenCalledWith('/api/owners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"Ana"}',
    });
  });

  it('returns undefined on 204 without reading a body', async () => {
    stubFetch(new Response(null, { status: 204 }));

    const result = await request('/quotes/1');

    expect(result).toBeUndefined();
  });

  it('rejects with an ApiError carrying status, detail and field errors on 422', async () => {
    const body = {
      detail: 'Dados inválidos',
      errors: [{ field: 'total', message: 'Deve ser maior que zero' }],
    };
    stubFetch(Response.json(body, { status: 422 }));

    const error = await request('/quotes').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, detail: 'Dados inválidos', errors: body.errors });
  });

  it('turns a non-contract error body (such as proxy HTML) into a generic ApiError', async () => {
    stubFetch(new Response('<html>Bad Gateway</html>', { status: 502 }));

    const error = await request('/quotes').catch((caught: unknown) => caught);

    expect(error).toMatchObject({ status: 502, detail: 'Erro inesperado do servidor', errors: [] });
  });

  it('turns a network failure into an ApiError with status 0', async () => {
    stubFetch(new TypeError('Failed to fetch'));

    const error = await request('/quotes').catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      status: 0,
      detail: 'Não foi possível conectar ao servidor',
      errors: [],
    });
  });
});

describe('withPage', () => {
  it('builds the query string only from the given page fields', () => {
    expect(withPage('/clients')).toBe('/clients');
    expect(withPage('/clients', { limit: 20 })).toBe('/clients?limit=20');
    expect(withPage('/clients', { limit: 20, offset: 40 })).toBe('/clients?limit=20&offset=40');
  });
});
