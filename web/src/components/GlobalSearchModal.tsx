import { useEffect, useState } from 'react';
import { listClients } from '../api/clients';
import { listOwners } from '../api/owners';
import { listQuotes } from '../api/quotes';
import type { Client, Owner, Quote } from '../api/types';
import { formatCurrency } from '../format';
import { quoteHref } from '../router';
import { CloseIcon, IconButton, SearchIcon } from './IconButton';
import { SearchHighlight } from './SearchHighlight';
import { normalizeText } from '../search';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function GlobalSearchContent({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;

    // allSettled keeps the lists that did load usable when one request fails.
    Promise.allSettled([
      listQuotes({ limit: 50 }),
      listClients({ limit: 50 }),
      listOwners({ limit: 50 }),
    ]).then(([quotesRes, clientsRes, ownersRes]) => {
      if (!active) return;
      if (quotesRes.status === 'fulfilled') setQuotes(quotesRes.value.items);
      if (clientsRes.status === 'fulfilled') setClients(clientsRes.value.items);
      if (ownersRes.status === 'fulfilled') setOwners(ownersRes.value.items);
      setLoadFailed(
        [quotesRes, clientsRes, ownersRes].some((result) => result.status === 'rejected'),
      );
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const trimmed = query.trim();
  const normQ = normalizeText(trimmed);

  const matchedQuotes = trimmed
    ? quotes.filter(
        (q) =>
          normalizeText(q.description).includes(normQ) ||
          normalizeText(q.client.name).includes(normQ) ||
          normalizeText(q.owner.name).includes(normQ),
      )
    : [];

  const matchedClients = trimmed
    ? clients.filter(
        (c) =>
          normalizeText(c.name).includes(normQ) ||
          (c.email && normalizeText(c.email).includes(normQ)) ||
          (c.phone && normalizeText(c.phone).includes(normQ)),
      )
    : [];

  const matchedOwners = trimmed
    ? owners.filter(
        (o) => normalizeText(o.name).includes(normQ) || normalizeText(o.role).includes(normQ),
      )
    : [];

  const hasResults =
    matchedQuotes.length > 0 || matchedClients.length > 0 || matchedOwners.length > 0;

  return (
    <div
      style={{ boxShadow: '0 16px 48px rgba(15, 31, 43, 0.18)' }}
      className="relative z-10 flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-[8px] border border-[#DDE5EC] bg-white"
    >
      {/* Search Input Bar */}
      <div className="flex h-14 items-center gap-3 border-b border-[#DDE5EC] px-4 text-[#52646F]">
        <SearchIcon size={20} />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por orçamento, cliente ou responsável..."
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] text-[#0F1F2B] outline-none placeholder:text-[#5F707B]"
        />
        <IconButton aria-label="Fechar busca" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && <p className="py-6 text-center text-sm text-[#52646F]">Carregando dados...</p>}

        {!loading && loadFailed && (
          <p
            role="alert"
            className="mb-4 rounded-[6px] border border-[#A12A2A] bg-[#FDECEC] p-3 text-sm font-medium text-[#A12A2A]"
          >
            Não foi possível carregar todos os dados da busca. Os resultados podem estar
            incompletos.
          </p>
        )}

        {!loading && !trimmed && (
          <p className="py-6 text-center text-sm text-[#52646F]">
            Digite um termo para pesquisar em todo o sistema.
          </p>
        )}

        {!loading && trimmed && !hasResults && (
          <div className="py-8 text-center">
            <p className="text-[16px] font-semibold text-[#0F1F2B]">Nenhum resultado</p>
            <p className="mt-1 text-sm text-[#52646F]">Não encontramos nada para “{trimmed}”.</p>
          </div>
        )}

        {!loading && trimmed && hasResults && (
          <div className="flex flex-col gap-5">
            {/* Quotes */}
            {matchedQuotes.length > 0 && (
              <div>
                <h3 className="mb-2 text-[12px] font-semibold tracking-wider text-[#52646F] uppercase">
                  Orçamentos ({matchedQuotes.length})
                </h3>
                <div className="flex flex-col gap-1">
                  {matchedQuotes.map((q) => (
                    <a
                      key={q.id}
                      href={quoteHref(q.id)}
                      onClick={onClose}
                      className="flex items-center justify-between gap-3 rounded-[6px] p-2.5 text-left transition-colors hover:bg-[#F4F8FB]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0F1F2B]">
                          <SearchHighlight text={q.description} query={trimmed} />
                        </p>
                        <p className="truncate text-[13px] text-[#52646F]">
                          Cliente: <SearchHighlight text={q.client.name} query={trimmed} /> ·
                          Responsável: <SearchHighlight text={q.owner.name} query={trimmed} />
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-[#0F1F2B] tabular-nums">
                        {formatCurrency(q.total)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Clients */}
            {matchedClients.length > 0 && (
              <div>
                <h3 className="mb-2 text-[12px] font-semibold tracking-wider text-[#52646F] uppercase">
                  Clientes ({matchedClients.length})
                </h3>
                <div className="flex flex-col gap-1">
                  {matchedClients.map((c) => (
                    <a
                      key={c.id}
                      href="#/clientes"
                      onClick={onClose}
                      className="flex items-center justify-between gap-3 rounded-[6px] p-2.5 text-left transition-colors hover:bg-[#F4F8FB]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0F1F2B]">
                          <SearchHighlight text={c.name} query={trimmed} />
                        </p>
                        {(c.email || c.phone) && (
                          <p className="truncate text-[13px] text-[#52646F]">
                            {[c.email, c.phone].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Owners */}
            {matchedOwners.length > 0 && (
              <div>
                <h3 className="mb-2 text-[12px] font-semibold tracking-wider text-[#52646F] uppercase">
                  Responsáveis ({matchedOwners.length})
                </h3>
                <div className="flex flex-col gap-1">
                  {matchedOwners.map((o) => (
                    <a
                      key={o.id}
                      href="#/responsaveis"
                      onClick={onClose}
                      className="flex items-center justify-between gap-3 rounded-[6px] p-2.5 text-left transition-colors hover:bg-[#F4F8FB]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0F1F2B]">
                          <SearchHighlight text={o.name} query={trimmed} />
                        </p>
                        <p className="truncate text-[13px] text-[#52646F]">
                          <SearchHighlight text={o.role} query={trimmed} />
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="border-t border-[#DDE5EC] bg-[#F4F7FA] px-4 py-2.5 text-right text-xs text-[#52646F]">
        Pressione <kbd className="font-semibold">ESC</kbd> para fechar
      </div>
    </div>
  );
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-16"
      role="dialog"
      aria-modal="true"
      aria-label="Busca global"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0F1F2B]/45 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <GlobalSearchContent onClose={onClose} />
    </div>
  );
}
