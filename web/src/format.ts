import type { CalendarDate, QuoteStatus } from './api/types';

// Presentation only: statuses travel in English and are shown in Portuguese (AGENTS.md §6).
export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  negotiating: 'Em negociação',
  no_response: 'Sem resposta',
  won: 'Ganho',
  lost: 'Perdido',
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percentFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

// Splits the string instead of using `new Date`, which would shift the day by the timezone.
export function formatDate(value: CalendarDate | null): string {
  if (value === null) return '—';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

// The API sends the ready-made fraction; the front only formats it.
export function formatPercent(rate: number | null): string {
  if (rate === null) return 'Sem dados';
  return percentFormatter.format(rate);
}
