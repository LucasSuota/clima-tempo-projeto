import { getIndicators } from '../api/indicators';
import { listStaleQuotes } from '../api/quotes';
import type { Quote } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { DataTable, type Column } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { IndicatorCards } from '../components/IndicatorCards';
import { StaleBadge } from '../components/StaleBadge';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency } from '../format';
import { useAsync } from '../hooks/useAsync';
import { quoteHref } from '../router';

const COLUMNS: Column<Quote>[] = [
  {
    header: 'Cliente',
    hideLabelOnCard: true,
    cell: (quote) => (
      <>
        <a href={quoteHref(quote.id)} className="font-medium text-sky-700 underline">
          {quote.client.name}
        </a>
        <span className="block text-sm text-slate-500">{quote.description}</span>
      </>
    ),
  },
  { header: 'Responsável', cell: (quote) => quote.owner.name },
  { header: 'Valor', cell: (quote) => formatCurrency(quote.total) },
  { header: 'Status', cell: (quote) => <StatusBadge status={quote.status} /> },
  { header: 'Situação', cell: (quote) => <StaleBadge days={quote.daysWithoutContact} /> },
];

export function DashboardPage() {
  const indicators = useAsync(getIndicators);
  const queue = useAsync(listStaleQuotes);

  return (
    <div className="space-y-8">
      <section aria-labelledby="indicators-title">
        <h1 id="indicators-title" className="mb-4 text-2xl font-bold md:text-3xl">
          Painel
        </h1>
        <AsyncView state={indicators}>{(data) => <IndicatorCards indicators={data} />}</AsyncView>
      </section>

      <section aria-labelledby="queue-title">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="queue-title" className="text-xl font-bold md:text-2xl">
            Quem contatar hoje
          </h2>
          <a href="#/orcamentos" className="text-sky-700 underline">
            Ver todos os orçamentos
          </a>
        </div>
        {/* Rendered in the order the API sends: the server decides who is most urgent. */}
        <AsyncView state={queue}>
          {(data) =>
            data.items.length === 0 ? (
              <EmptyState title="Nenhum orçamento parado. Tudo em dia." />
            ) : (
              <DataTable items={data.items} columns={COLUMNS} getKey={(quote) => quote.id} />
            )
          }
        </AsyncView>
      </section>
    </div>
  );
}
