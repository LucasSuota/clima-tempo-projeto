import { listOwners } from '../api/owners';
import type { Owner } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { Button } from '../components/Button';
import { DataTable, type Column } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { OwnerForm } from '../components/OwnerForm';
import { Pagination } from '../components/Pagination';
import { SearchHighlight } from '../components/SearchHighlight';
import { SearchInput } from '../components/SearchInput';
import { SlideOver } from '../components/SlideOver';
import { DRAFT_KEYS } from '../draft-storage';
import { usePagedList } from '../hooks/usePagedList';
import { usePersistedState } from '../hooks/usePersistedState';
import { PAGE_SIZE } from '../pagination';
import { normalizeText } from '../search';
import {
  parseCrudPanel,
  parseSearchListState,
  type CrudPanel,
  type SearchListState,
} from '../ui-state';

const INITIAL_LIST: SearchListState = { search: '', page: 1 };

export function OwnersPage() {
  const [list, setList] = usePersistedState(
    DRAFT_KEYS.listOwners(),
    INITIAL_LIST,
    parseSearchListState,
  );
  const { search } = list;
  const owners = usePagedList(listOwners, list.page, (page) =>
    setList((current) => ({ ...current, page })),
  );
  const [panel, setPanel] = usePersistedState<CrudPanel | null>(
    DRAFT_KEYS.panelOwners(),
    null,
    parseCrudPanel,
  );

  function setSearch(value: string) {
    setList((current) => ({ ...current, search: value }));
  }

  // Hides the panel but keeps the form draft; only Cancel and a successful save discard it.
  function closePanel() {
    setPanel(null);
  }

  function handleSaved() {
    closePanel();
    owners.setPage(1);
    owners.reload();
  }

  const columns: Column<Owner>[] = [
    {
      header: 'Nome',
      hideLabelOnCard: true,
      cell: (owner) => (
        <span className="font-semibold text-[#0F1F2B]">
          <SearchHighlight text={owner.name} query={search} />
        </span>
      ),
    },
    {
      header: 'Cargo/função',
      cell: (owner) => (
        <span className="text-sm text-[#52646F]">
          <SearchHighlight text={owner.role} query={search} />
        </span>
      ),
    },
  ];

  return (
    <section>
      {/* Fixed Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[32px] leading-10 font-bold tracking-tight text-[#0F1F2B]">
          Responsáveis
        </h1>
        <Button variant="primary" onClick={() => setPanel({ kind: 'create' })}>
          Novo responsável
        </Button>
      </div>

      <AsyncView state={owners}>
        {(data) => {
          const rawItems = data.items;
          const normQuery = normalizeText(search.trim());

          const filtered = normQuery
            ? rawItems.filter(
                (o) =>
                  normalizeText(o.name).includes(normQuery) ||
                  normalizeText(o.role).includes(normQuery),
              )
            : rawItems;

          return (
            <div className="overflow-hidden rounded-[8px] border border-[#DDE5EC] bg-white">
              {/* Card header: search */}
              <div className="flex flex-col gap-3 border-b border-[#DDE5EC] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar por nome ou cargo"
                  aria-label="Buscar responsáveis"
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
                    title="Nenhum responsável encontrado"
                    description={
                      search.trim()
                        ? `Não encontramos resultados para “${search.trim()}”.`
                        : 'Nenhum responsável cadastrado ainda.'
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
                  getKey={(owner) => owner.id}
                  ariaLabel="Tabela de responsáveis"
                />
              )}

              {/* Card footer: pagination */}
              <Pagination
                page={owners.page}
                total={data.total}
                pageSize={PAGE_SIZE}
                onPageChange={owners.setPage}
                resourceName="responsáveis"
              />
            </div>
          );
        }}
      </AsyncView>

      {/* SlideOver for Owner Creation */}
      <SlideOver isOpen={panel?.kind === 'create'} onClose={closePanel} title="Novo responsável">
        <OwnerForm onSaved={handleSaved} onCancel={closePanel} inSlideOver />
      </SlideOver>
    </section>
  );
}
