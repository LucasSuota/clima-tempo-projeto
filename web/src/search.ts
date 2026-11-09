// Strips accents and lowercases, so "Orçamento" matches "orcamento" in client-side filters.
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
