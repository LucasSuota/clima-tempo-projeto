export type Route =
  | { name: 'quotes' }
  | { name: 'quote'; id: number }
  | { name: 'clients' }
  | { name: 'owners' }
  | { name: 'notFound' };

const DIGITS_ONLY = /^\d+$/;

// Same rule as the server: a malformed id is a screen that does not exist.
function parseId(segment: string): number | null {
  if (!DIGITS_ONLY.test(segment)) return null;
  const id = Number(segment);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '');
  const [, section, idSegment, ...rest] = path.split('/');

  if (path === '' || (section === 'orcamentos' && idSegment === undefined)) {
    return { name: 'quotes' };
  }
  if (section === 'orcamentos' && rest.length === 0 && idSegment !== undefined) {
    const id = parseId(idSegment);
    return id === null ? { name: 'notFound' } : { name: 'quote', id };
  }
  if (idSegment === undefined && section === 'clientes') return { name: 'clients' };
  if (idSegment === undefined && section === 'responsaveis') return { name: 'owners' };
  return { name: 'notFound' };
}

export function quoteHref(id: number): string {
  return `#/orcamentos/${id}`;
}
