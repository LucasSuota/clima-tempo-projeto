import { describe, expect, it } from 'vitest';
import { parseRoute, quoteHref } from '../src/router';

describe('parseRoute', () => {
  it.each(['', '#', '#/', '#/orcamentos', '#/orcamentos/'])(
    'sends %j to the quotes list',
    (hash) => {
      expect(parseRoute(hash)).toEqual({ name: 'quotes' });
    },
  );

  it('reads the quote id from the hash', () => {
    expect(parseRoute('#/orcamentos/12')).toEqual({ name: 'quote', id: 12 });
  });

  it('tolerates a trailing slash after the id', () => {
    expect(parseRoute('#/orcamentos/12/')).toEqual({ name: 'quote', id: 12 });
  });

  it.each([
    '#/orcamentos/abc',
    '#/orcamentos/0',
    '#/orcamentos/1.5',
    '#/orcamentos/99999999999999999999',
  ])('treats the malformed id in %j as not found', (hash) => {
    expect(parseRoute(hash)).toEqual({ name: 'notFound' });
  });

  it('finds the clients and owners screens', () => {
    expect(parseRoute('#/clientes')).toEqual({ name: 'clients' });
    expect(parseRoute('#/responsaveis')).toEqual({ name: 'owners' });
  });

  it.each(['#/xyz', '#/clientes/1', '#/orcamentos/1/extra'])('treats %j as not found', (hash) => {
    expect(parseRoute(hash)).toEqual({ name: 'notFound' });
  });
});

describe('quoteHref', () => {
  it('builds the hash of the detail screen', () => {
    expect(quoteHref(7)).toBe('#/orcamentos/7');
  });
});
