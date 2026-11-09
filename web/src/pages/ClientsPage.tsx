import { useEffect } from 'react';
import { deleteClient, listClients } from '../api/clients';
import type { Client } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { Button } from '../components/Button';
import { ClientActions } from '../components/ClientActions';
import { ClientForm } from '../components/ClientForm';
import { DataTable, type Column } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { MissingValue } from '../components/MissingValue';
import { Pagination } from '../components/Pagination';
import { SearchHighlight } from '../components/SearchHighlight';
import { SearchInput } from '../components/SearchInput';
import { SlideOver } from '../components/SlideOver';
import { DRAFT_KEYS, discardDraft } from '../draft-storage';
import { usePagedList } from '../hooks/usePagedList';
import { usePersistedState } from '../hooks/usePersistedState';
import { useSubmit } from '../hooks/useSubmit';
import { PAGE_SIZE } from '../pagination';
import { normalizeText } from '../search';
import {
  parseCrudPanel,
  parseSearchListState,
  type CrudPanel,
  type SearchListState,
} from '../ui-state';

const INITIAL_LIST: SearchListState = { search: '', page: 1 };

export function ClientsPage() {
  const [list, setList] = usePersistedState(
    DRAFT_KEYS.listClients(),
    INITIAL_LIST,
    parseSearchListState,
  );
  const { search } = list;
  const clients = usePagedList(listClients, list.page, (page) =>
    setList((current) => ({ ...current, page })),
  );
  const [panel, setPanel] = usePersistedState<CrudPanel | null>(
    DRAFT_KEYS.panelClients(),
    null,
    parseCrudPanel,
  );
  const removal = useSubmit([]);

  // There is no GET for a single client, so the edited one comes from the loaded page.
  const editing =
    panel?.kind === 'edit' ? clients.data?.items.find((item) => item.id === panel.id) : undefined;
  const panelOpen = panel?.kind === 'create' || editing !== undefined;
  const missingId =
    panel?.kind === 'edit' && clients.data !== undefined && !clients.loading && !editing
      ? panel.id
      : null;

  // The restored panel points to a client that no longer exists: forget it and its draft.
  useEffect(() => {
    if (missingId === null) return;
    discardDraft(DRAFT_KEYS.panelClients());
    discardDraft(DRAFT_KEYS.clientForm(missingId));
  }, [missingId]);

  function setSearch(value: string) {
    setList((current) => ({ ...current, search: value }));
  }

  // Hides the panel but keeps the form draft; only Cancel and a successful save discard it.
  function closePanel() {
    setPanel(null);
  }

  function handleSaved() {
    const wasEditing = panel?.kind === 'edit';
    closePanel();
    if (!wasEditing) clients.setPage(1);
    clients.reload();
  }

  async function handleDelete(client: Client) {
    const removed = await removal.run(() => deleteClient(client.id));
    if (removed) clients.reload();
  }

  const columns: Column<Client>[] = [
    {
      header: 'Nome',
      hideLabelOnCard: true,
      cell: (client) => (
        <span className="font-semibold text-[#0F1F2B]">
          <SearchHighlight text={client.name} query={search} />
        </span>
      ),
    },
    {
      header: 'E-mail',
      cell: (client) =>
        client.email ? <SearchHighlight text={client.email} query={search} /> : <MissingValue />,
    },
    {
      header: 'Telefone',
      cell: (client) =>
        client.phone ? <SearchHighlight text={client.phone} query={search} /> : <MissingValue />,
    },
    {
      header: 'Ações',
      align: 'right',
      hideLabelOnCard: true,
      cell: (client) => (
        <ClientActions
          client={client}
          disabled={removal.submitting}
          onEdit={(item) => setPanel({ kind: 'edit', id: item.id })}
          onDelete={handleDelete}
        />
      ),
    },
  ];

  return (
    <section>
      {/* Fixed Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[32px] leading-10 font-bold tracking-tight text-[#0F1F2B]">Clientes</h1>
        <Button variant="primary" onClick={() => setPanel({ kind: 'create' })}>
          Novo cliente
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

      <AsyncView state={clients}>
        {(data) => {
          const rawItems = data.items;
          const normQuery = normalizeText(search.trim());

          const filtered = normQuery
            ? rawItems.filter(
                (c) =>
                  normalizeText(c.name).includes(normQuery) ||
                  (c.email && normalizeText(c.email).includes(normQuery)) ||
                  (c.phone && normalizeText(c.phone).includes(normQuery)),
              )
            : rawItems;

          return (
            <div className="overflow-hidden rounded-[8px] border border-[#DDE5EC] bg-white">
              {/* Card header: search */}
              <div className="flex flex-col gap-3 border-b border-[#DDE5EC] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar por nome, e-mail ou telefone"
                  aria-label="Buscar clientes"
                  className="w-full sm:max-w-md"
                />
                {search.trim() && (
                  <p aria-live="polite" className="text-sm text-[#52646F]">
                    <span className="font-semibold text-[#0F1F2B]">
                      {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
                    </span>{' '}
                    para “{search.trim()}”
                  </p>
                )}
              </div>

              {filtered.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="Nenhum cliente encontrado"
                    description={
                      search.trim()
                        ? `Não encontramos resultados para “${search.trim()}”.`
                        : 'Nenhum cliente cadastrado ainda.'
                    }
                    action={
                      search.trim() ? (
                        <Button variant="secondary" onClick={() => setSearch('')}>
                          Limpar busca
                        </Button>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                <DataTable
                  items={filtered}
                  columns={columns}
                  getKey={(client) => client.id}
                  ariaLabel="Tabela de clientes"
                />
              )}

              {/* Card footer: pagination */}
              <Pagination
                page={clients.page}
                total={data.total}
                pageSize={PAGE_SIZE}
                onPageChange={clients.setPage}
                resourceName="clientes"
              />
            </div>
          );
        }}
      </AsyncView>

      {/* SlideOver for Client Creation and Edition */}
      <SlideOver
        isOpen={panelOpen}
        onClose={closePanel}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
      >
        <ClientForm
          key={editing?.id ?? 'new'}
          client={editing}
          onSaved={handleSaved}
          onCancel={closePanel}
          inSlideOver
        />
      </SlideOver>
    </section>
  );
}
