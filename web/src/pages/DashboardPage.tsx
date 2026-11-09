import { useEffect, useState } from 'react';
import { listClients } from '../api/clients';
import { getIndicators } from '../api/indicators';
import { listStaleQuotes } from '../api/quotes';
import type { Client, Quote } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { Button } from '../components/Button';
import { DataTable, type Column } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { FollowUpForm } from '../components/FollowUpForm';
import { IndicatorCards } from '../components/IndicatorCards';
import { QueueAgingChart } from '../components/QueueAgingChart';
import { SlideOver } from '../components/SlideOver';
import { DRAFT_KEYS, discardDraft } from '../draft-storage';
import { formatCurrency, formatDays, staleTone } from '../format';
import { useAsync } from '../hooks/useAsync';
import { usePersistedState } from '../hooks/usePersistedState';
import { quoteHref } from '../router';
import { parseQuoteIdPanel, type QuoteIdPanel } from '../ui-state';

export function DashboardPage() {
  const indicators = useAsync(getIndicators);
  const queue = useAsync(listStaleQuotes);
  const [clientsMap, setClientsMap] = useState<Record<number, Client>>({});
  const [clientsFailed, setClientsFailed] = useState(false);
  const [panel, setPanel] = usePersistedState<QuoteIdPanel | null>(
    DRAFT_KEYS.panelDashboardFollowUp(),
    null,
    parseQuoteIdPanel,
  );
  // The quote comes from the queue, so one that left it (contact registered elsewhere) closes.
  const selectedQuote = panel
    ? queue.data?.items.find((item) => item.id === panel.quoteId)
    : undefined;
  const missingQuoteId =
    panel && queue.data !== undefined && !queue.loading && !selectedQuote ? panel.quoteId : null;

  useEffect(() => {
    if (missingQuoteId === null) return;
    discardDraft(DRAFT_KEYS.panelDashboardFollowUp());
    discardDraft(DRAFT_KEYS.followUpForm(missingQuoteId));
  }, [missingQuoteId]);

  // Fetch client details to check phone for WhatsApp action
  useEffect(() => {
    listClients({ limit: 100 })
      .then((res) => {
        const map: Record<number, Client> = {};
        for (const c of res.items) map[c.id] = c;
        setClientsMap(map);
      })
      .catch(() => setClientsFailed(true));
  }, []);

  // Hides the panel but keeps the form draft; only Cancel and a successful save discard it.
  function closePanel() {
    setPanel(null);
  }

  function handleFollowUpSaved() {
    closePanel();
    indicators.reload();
    queue.reload();
  }

  const columns: Column<Quote>[] = [
    {
      header: 'Orçamento',
      hideLabelOnCard: true,
      cell: (quote) => (
        <div className="min-w-0">
          <a
            href={quoteHref(quote.id)}
            className="text-sm font-semibold text-[#0F1F2B] hover:text-[#1B5FA6] hover:underline"
          >
            {quote.description}
          </a>
          <div className="text-[13px] leading-[18px] text-[#52646F]">{quote.client.name}</div>
        </div>
      ),
    },
    {
      header: 'Quem liga',
      cell: (quote) => (
        <div className="min-w-0">
          <div className="text-sm font-medium text-[#0F1F2B]">{quote.owner.name}</div>
          <div className="text-[13px] leading-[18px] text-[#52646F]">{quote.owner.role}</div>
        </div>
      ),
    },
    {
      header: 'Valor',
      align: 'right',
      cell: (quote) => (
        <span className="font-semibold tabular-nums text-[#0F1F2B]">
          {formatCurrency(quote.total)}
        </span>
      ),
    },
    {
      header: 'Parado há',
      cell: (quote) => {
        const days = quote.daysWithoutContact ?? 0;
        const color = staleTone(days) === 'critical' ? 'text-[#A12A2A]' : 'text-[#A34A06]';
        return <span className={`font-bold whitespace-nowrap ${color}`}>{formatDays(days)}</span>;
      },
    },
    {
      header: 'Ações',
      align: 'right',
      cell: (quote) => {
        const client = clientsMap[quote.client.id];
        const phone = client?.phone;
        const cleanPhone = phone?.replace(/\D/g, '');

        return (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {cleanPhone ? (
              <a
                href={`https://wa.me/55${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-[6px] border border-[#C3CFD9] bg-white px-4 text-sm font-semibold text-[#0F1F2B] transition-colors hover:bg-[#F4F7FA] hover:border-[#8FA3B2]"
              >
                WhatsApp
              </a>
            ) : clientsFailed ? (
              <span className="text-[13px] leading-[18px] text-[#A12A2A]">
                Não foi possível carregar os telefones
              </span>
            ) : (
              <div className="flex items-center gap-1.5 text-[13px] leading-[18px]">
                <span className="text-[#52646F]">Sem telefone.</span>
                <a
                  href="#/clientes"
                  className="font-semibold text-[#144C88] hover:text-[#1B5FA6] hover:underline"
                >
                  Cadastrar
                </a>
              </div>
            )}
            <Button
              variant="primary"
              onClick={() => setPanel({ quoteId: quote.id })}
              className="!px-4 !text-sm"
            >
              Registrar contato
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-10">
      {/* Top Indicators Section */}
      <section aria-labelledby="indicators-title">
        <h1
          id="indicators-title"
          className="mb-4 text-[32px] leading-10 font-bold tracking-tight text-[#0F1F2B]"
        >
          Painel
        </h1>
        <AsyncView state={indicators}>{(data) => <IndicatorCards indicators={data} />}</AsyncView>
      </section>

      {/* Queue Section ("Para ligar hoje") */}
      <section aria-labelledby="queue-title">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h2 id="queue-title" className="text-[20px] leading-7 font-semibold text-[#0F1F2B]">
              Para ligar hoje
            </h2>
            <p className="text-sm leading-5 text-[#52646F]">
              Cada contato registrado tira o orçamento da fila.
            </p>
          </div>
          <a
            href="#/orcamentos"
            className="text-sm font-semibold text-[#144C88] hover:text-[#1B5FA6] hover:underline"
          >
            Ver todos os orçamentos →
          </a>
        </div>

        <AsyncView state={queue}>
          {(data) =>
            data.items.length === 0 ? (
              <EmptyState
                title="Fila de hoje concluída"
                description="Todos os contatos foram registrados. Voltam à fila se ficarem muito tempo sem contato."
                tag="Fila vazia"
              />
            ) : (
              <div className="space-y-4">
                <QueueAgingChart items={data.items} />
                <div className="overflow-hidden rounded-[8px] border border-[#DDE5EC] bg-white">
                  <DataTable
                    items={data.items}
                    columns={columns}
                    getKey={(quote) => quote.id}
                    ariaLabel="Fila de ligação de hoje"
                  />
                </div>
              </div>
            )
          }
        </AsyncView>
      </section>

      {/* SlideOver for Registering Follow-Up */}
      <SlideOver
        isOpen={selectedQuote !== undefined}
        onClose={closePanel}
        title="Registrar contato"
      >
        {selectedQuote && (
          <FollowUpForm
            quoteId={selectedQuote.id}
            onSaved={handleFollowUpSaved}
            onCancel={closePanel}
            inSlideOver
          />
        )}
      </SlideOver>
    </div>
  );
}
