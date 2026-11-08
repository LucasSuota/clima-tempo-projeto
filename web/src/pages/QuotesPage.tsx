import { useState } from 'react';
import { listQuotes } from '../api/quotes';
import type { Quote } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { Button } from '../components/Button';
import { DataTable, type Column } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { QuoteForm } from '../components/QuoteForm';
import { StaleBadge } from '../components/StaleBadge';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency } from '../format';
import { useAsync } from '../hooks/useAsync';
import { quoteHref } from '../router';

const COLUMNS: Column<Quote>[] = [
  {
    header: 'Descrição',
    hideLabelOnCard: true,
    cell: (quote) => (
      <a href={quoteHref(quote.id)} className="font-medium text-sky-700 underline">
        {quote.description}
      </a>
    ),
  },
  { header: 'Cliente', cell: (quote) => quote.client.name },
  {
    header: 'Responsável',
    cell: (quote) => (
      <>
        {quote.owner.name} <span className="text-sm text-slate-500">({quote.owner.role})</span>
      </>
    ),
  },
  { header: 'Valor', cell: (quote) => formatCurrency(quote.total) },
  {
    header: 'Status',
    cell: (quote) => (
      <span className="inline-flex flex-wrap gap-1">
        <StatusBadge status={quote.status} />
        {quote.isStale && <StaleBadge days={quote.daysWithoutContact} />}
      </span>
    ),
  },
];

export function QuotesPage() {
  const quotes = useAsync(listQuotes);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Orçamentos</h1>
        {!formOpen && <Button onClick={() => setFormOpen(true)}>Novo orçamento</Button>}
      </div>
      {formOpen && <QuoteForm onCancel={() => setFormOpen(false)} />}
      <AsyncView state={quotes}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState title="Nenhum orçamento cadastrado" />
          ) : (
            <DataTable items={data.items} columns={COLUMNS} getKey={(quote) => quote.id} />
          )
        }
      </AsyncView>
    </section>
  );
}
