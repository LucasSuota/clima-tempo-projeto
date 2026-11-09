import { useEffect } from 'react';
import { deleteQuote, listQuotes } from '../api/quotes';
import type { Quote } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { Button } from '../components/Button';
import { DataTable, type Column } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { FilterDropdown, type FilterOption } from '../components/FilterDropdown';
import { EditIcon, IconButton, TrashIcon } from '../components/IconButton';
import { Pagination } from '../components/Pagination';
import { QuoteForm } from '../components/QuoteForm';
import { SearchHighlight } from '../components/SearchHighlight';
import { SearchInput } from '../components/SearchInput';
import { SlideOver } from '../components/SlideOver';
import { StaleIndicator } from '../components/StaleIndicator';
import { StatusBadge } from '../components/StatusBadge';
import { DRAFT_KEYS, discardDraft } from '../draft-storage';
import { QUOTE_STATUS_LABELS, formatCurrency } from '../format';
import { usePagedList } from '../hooks/usePagedList';
import { usePersistedState } from '../hooks/usePersistedState';
import { useSubmit } from '../hooks/useSubmit';
import { PAGE_SIZE } from '../pagination';
import { quoteHref } from '../router';
import { normalizeText } from '../search';
import {
  parseCrudPanel,
  parseQuotesListState,
  type CrudPanel,
  type QuotesListState,
  type StatusFilter,
} from '../ui-state';

const INITIAL_LIST: QuotesListState = { search: '', filter: 'all', page: 1 };

export function QuotesPage() {
  const [list, setList] = usePersistedState(
    DRAFT_KEYS.listQuotes(),
    INITIAL_LIST,
    parseQuotesListState,
  );
  const { search, filter } = list;
  const quotes = usePagedList(listQuotes, list.page, (page) =>
    setList((current) => ({ ...current, page })),
  );
  const [panel, setPanel] = usePersistedState<CrudPanel | null>(
    DRAFT_KEYS.panelQuotes(),
    null,
    parseCrudPanel,
  );
  const removal = useSubmit([]);

  // The edited quote comes from the loaded page: there is no GET for a single quote here.
  const editingQuote =
    panel?.kind === 'edit' ? quotes.data?.items.find((item) => item.id === panel.id) : undefined;
  const panelOpen = panel?.kind === 'create' || editingQuote !== undefined;
  const missingId =
    panel?.kind === 'edit' && quotes.data !== undefined && !quotes.loading && !editingQuote
      ? panel.id
      : null;

  // The restored panel points to a quote that no longer exists: forget it and its draft.
  useEffect(() => {
    if (missingId === null) return;
    discardDraft(DRAFT_KEYS.panelQuotes());
    discardDraft(DRAFT_KEYS.quoteForm(missingId));
  }, [missingId]);

  function setSearch(value: string) {
    setList((current) => ({ ...current, search: value }));
  }

  function setFilter(value: StatusFilter) {
    setList((current) => ({ ...current, filter: value }));
  }

  // Hides the panel but keeps the form draft; only Cancel and a successful save discard it.
  function handleClosePanel() {
    setPanel(null);
  }

  function handleSaved() {
    setPanel(null);
    quotes.reload();
  }

  async function handleDelete(quote: Quote) {
    const confirmed = window.confirm(`Excluir o orçamento "${quote.description}"?`);
    if (!confirmed) return;
    const deleted = await removal.run(() => deleteQuote(quote.id));
    if (deleted) quotes.reload();
  }

  function handleClearFilters() {
    setSearch('');
    setFilter('all');
  }

  return (
    <section>
      {/* Fixed Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[32px] leading-10 font-bold tracking-tight text-[#0F1F2B]">
          Orçamentos
        </h1>
        <Button variant="primary" onClick={() => setPanel({ kind: 'create' })}>
          Novo orçamento
        </Button>
      </div>

      {removal.message && (
        <p
          role="alert"
          className="mb-4 rounded-[6px] border border-[#A12A2A] bg-[#FDECEC] p-3 text-sm font-medium text-[#A12A2A]"
        >
          {removal.message}
        </p>
      )}

      <AsyncView state={quotes}>
        {(data) => {
          const rawItems = data.items;
          const normQuery = normalizeText(search.trim());

          // Search filtering (client-side over current page items)
          const searched = normQuery
            ? rawItems.filter(
                (q) =>
                  normalizeText(q.description).includes(normQuery) ||
                  normalizeText(q.client.name).includes(normQuery) ||
                  normalizeText(q.owner.name).includes(normQuery),
              )
            : rawItems;

          // Status filtering
          const filtered = searched.filter((q) => {
            if (filter === 'all') return true;
            if (filter === 'stale') return q.isStale;
            return q.status === filter;
          });

          // Filter counts based on search query
          const filterOptions: FilterOption<StatusFilter>[] = [
            { id: 'all', label: 'Todos', count: searched.length },
            {
              id: 'negotiating',
              label: QUOTE_STATUS_LABELS.negotiating,
              count: searched.filter((q) => q.status === 'negotiating').length,
            },
            {
              id: 'no_response',
              label: QUOTE_STATUS_LABELS.no_response,
              count: searched.filter((q) => q.status === 'no_response').length,
            },
            {
              id: 'sent',
              label: QUOTE_STATUS_LABELS.sent,
              count: searched.filter((q) => q.status === 'sent').length,
            },
            {
              id: 'won',
              label: QUOTE_STATUS_LABELS.won,
              count: searched.filter((q) => q.status === 'won').length,
            },
            {
              id: 'stale',
              label: 'Parados',
              count: searched.filter((q) => q.isStale).length,
            },
          ];

          const columns: Column<Quote>[] = [
            {
              header: 'Descrição',
              hideLabelOnCard: true,
              cell: (quote) => (
                <a
                  href={quoteHref(quote.id)}
                  className="font-semibold text-[#0F1F2B] hover:text-[#1B5FA6] hover:underline"
                >
                  <SearchHighlight text={quote.description} query={search} />
                </a>
              ),
            },
            {
              header: 'Cliente',
              cell: (quote) => (
                <span className="truncate text-sm text-[#0F1F2B]">
                  <SearchHighlight text={quote.client.name} query={search} />
                </span>
              ),
            },
            {
              header: 'Responsável',
              cell: (quote) => (
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-[#0F1F2B]">
                    <SearchHighlight text={quote.owner.name} query={search} />
                  </div>
                  <div className="truncate text-[13px] leading-[18px] text-[#52646F]">
                    {quote.owner.role}
                  </div>
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
              header: 'Status',
              cell: (quote) => (
                <div className="flex flex-col items-start gap-0.5">
                  <StatusBadge status={quote.status} />
                  {quote.isStale && <StaleIndicator days={quote.daysWithoutContact} />}
                </div>
              ),
            },
            {
              header: 'Ações',
              align: 'right',
              hideLabelOnCard: true,
              cell: (quote) => (
                <div className="flex items-center justify-end gap-1">
                  <IconButton
                    aria-label={`Editar ${quote.description}`}
                    onClick={() => setPanel({ kind: 'edit', id: quote.id })}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    variant="danger"
                    aria-label={`Excluir ${quote.description}`}
                    disabled={removal.submitting}
                    onClick={() => handleDelete(quote)}
                  >
                    <TrashIcon />
                  </IconButton>
                </div>
              ),
            },
          ];

          return (
            <div className="rounded-[8px] border border-[#DDE5EC] bg-white">
              {/* Card header: search and filters */}
              <div className="border-b border-[#DDE5EC] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex w-full min-w-0 items-center gap-2 sm:max-w-xl">
                    <SearchInput
                      value={search}
                      onChange={setSearch}
                      placeholder="Buscar por descrição, cliente ou responsável"
                      aria-label="Buscar orçamentos"
                      className="min-w-0 flex-1"
                    />
                    <FilterDropdown
                      options={filterOptions}
                      selectedId={filter}
                      onSelect={setFilter}
                    />
                  </div>
                  {search.trim() && (
                    <p aria-live="polite" className="text-sm text-[#52646F]">
                      <span className="font-semibold text-[#0F1F2B]">
                        {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
                      </span>{' '}
                      para “{search.trim()}”
                    </p>
                  )}
                </div>
              </div>

              {/* The clip lives below the header so the filter menu can overflow the card. */}
              <div className="overflow-hidden rounded-b-[7px]">
                {/* Table or Empty State */}
                {filtered.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      title="Nenhum orçamento encontrado"
                      description={
                        search.trim()
                          ? `Não encontramos resultados para “${search.trim()}”. Confira a grafia ou tire algum filtro.`
                          : 'Não há orçamentos correspondentes a este filtro.'
                      }
                      action={
                        <Button variant="secondary" onClick={handleClearFilters}>
                          Limpar busca e filtros
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <DataTable
                    items={filtered}
                    columns={columns}
                    getKey={(quote) => quote.id}
                    ariaLabel="Tabela de orçamentos"
                  />
                )}

                {/* Card footer: pagination */}
                <Pagination
                  page={quotes.page}
                  total={data.total}
                  pageSize={PAGE_SIZE}
                  onPageChange={quotes.setPage}
                  resourceName="orçamentos"
                />
              </div>
            </div>
          );
        }}
      </AsyncView>

      {/* SlideOver for Quote Creation and Edition */}
      <SlideOver
        isOpen={panelOpen}
        onClose={handleClosePanel}
        title={editingQuote ? 'Editar orçamento' : 'Novo orçamento'}
        widthClass="w-full sm:max-w-[480px]"
      >
        <QuoteForm
          key={editingQuote?.id ?? 'new'}
          quote={editingQuote}
          onSaved={handleSaved}
          onCancel={handleClosePanel}
          inSlideOver
        />
      </SlideOver>
    </section>
  );
}
