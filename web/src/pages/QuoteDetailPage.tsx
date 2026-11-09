import { useCallback } from 'react';
import { listFollowUps } from '../api/follow-ups';
import { deleteQuote, getQuote } from '../api/quotes';
import { AsyncView } from '../components/AsyncView';
import { FollowUpForm } from '../components/FollowUpForm';
import { FollowUpHistory } from '../components/FollowUpHistory';
import { MissingValue } from '../components/MissingValue';
import { QuoteActions } from '../components/QuoteActions';
import { QuoteForm } from '../components/QuoteForm';
import { SlideOver } from '../components/SlideOver';
import { StaleIndicator } from '../components/StaleIndicator';
import { StatusBadge } from '../components/StatusBadge';
import { StatusChangeForm } from '../components/StatusChangeForm';
import { DRAFT_KEYS } from '../draft-storage';
import { formatCurrency, formatDate, formatDays } from '../format';
import { useAsync } from '../hooks/useAsync';
import { usePersistedState } from '../hooks/usePersistedState';
import { useSubmit } from '../hooks/useSubmit';
import { parseEditPanel, type EditPanel } from '../ui-state';

export function QuoteDetailPage({ id }: { id: number }) {
  const loadQuote = useCallback(() => getQuote(id), [id]);
  const loadFollowUps = useCallback(() => listFollowUps(id), [id]);
  const quote = useAsync(loadQuote);
  const followUps = useAsync(loadFollowUps);
  // `key={id}` in App remounts the page per quote, so the panel key never changes while mounted.
  const [panel, setPanel] = usePersistedState<EditPanel | null>(
    DRAFT_KEYS.panelQuoteDetail(id),
    null,
    parseEditPanel,
  );
  const removal = useSubmit([]);

  // Hides the panel but keeps the form draft; only Cancel and a successful save discard it.
  function closePanel() {
    setPanel(null);
  }

  function handleEdited() {
    closePanel();
    quote.reload();
  }

  async function handleDelete() {
    const deleted = await removal.run(() => deleteQuote(id));
    if (deleted) window.location.hash = '#/orcamentos';
  }

  function handleFollowUpSaved() {
    quote.reload();
    followUps.reload();
  }

  return (
    <section className="space-y-6">
      <div>
        <a
          href="#/orcamentos"
          className="text-sm font-semibold text-[#144C88] hover:text-[#1B5FA6] hover:underline"
        >
          ← Voltar para orçamentos
        </a>
      </div>

      <AsyncView state={quote}>
        {(data) => (
          <>
            {/* Main Quote Card */}
            <div className="flex flex-col gap-6 rounded-[8px] border border-[#DDE5EC] bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-[28px] leading-9 font-bold tracking-tight text-[#0F1F2B] sm:text-[32px] sm:leading-10">
                    {data.description}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <StatusBadge status={data.status} />
                    {data.isStale && <StaleIndicator days={data.daysWithoutContact} />}
                  </div>
                </div>

                <QuoteActions
                  disabled={removal.submitting}
                  onEdit={() => setPanel({ kind: 'edit' })}
                  onDelete={handleDelete}
                />
              </div>

              {removal.message && (
                <p
                  role="alert"
                  className="rounded-[6px] border border-[#A12A2A] bg-[#FDECEC] p-3 text-sm font-medium text-[#A12A2A]"
                >
                  {removal.message}
                </p>
              )}

              {/* Data Grid */}
              <div className="grid grid-cols-1 gap-6 border-t border-[#E7EDF2] pt-6 sm:grid-cols-2 md:grid-cols-3">
                <InfoItem label="Cliente" value={data.client.name} />
                <InfoItem label="Responsável" value={`${data.owner.name} (${data.owner.role})`} />
                <InfoItem
                  label="Valor"
                  value={
                    <span className="font-semibold tabular-nums text-[#0F1F2B]">
                      {formatCurrency(data.total)}
                    </span>
                  }
                />
                <InfoItem
                  label="Data de envio"
                  value={
                    data.sentAt ? (
                      <span className="tabular-nums">{formatDate(data.sentAt)}</span>
                    ) : (
                      <MissingValue text="Não enviada" />
                    )
                  }
                />
                <InfoItem
                  label="Dias sem contato"
                  value={
                    data.daysWithoutContact !== null ? (
                      <span className="tabular-nums font-semibold">
                        {formatDays(data.daysWithoutContact)}
                      </span>
                    ) : (
                      <MissingValue text="Sem pendência" />
                    )
                  }
                />
              </div>
            </div>

            {/* Actions Grid: Status Change & Follow-up registration */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <StatusChangeForm quote={data} onChanged={quote.reload} />
              <FollowUpForm key={data.status} quoteId={data.id} onSaved={handleFollowUpSaved} />
            </div>

            {/* History Section */}
            <div>
              <h2 className="mb-3 text-[20px] leading-7 font-semibold text-[#0F1F2B]">
                Histórico de contatos
              </h2>
              <FollowUpHistory state={followUps} />
            </div>

            {/* SlideOver for Editing Quote */}
            <SlideOver
              isOpen={panel !== null}
              onClose={closePanel}
              title="Editar orçamento"
              widthClass="w-full sm:max-w-[480px]"
            >
              <QuoteForm
                key={data.id}
                quote={data}
                onSaved={handleEdited}
                onCancel={closePanel}
                inSlideOver
              />
            </SlideOver>
          </>
        )}
      </AsyncView>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] leading-[18px] font-semibold text-[#52646F]">{label}</span>
      <div className="text-sm leading-5 text-[#0F1F2B]">{value}</div>
    </div>
  );
}
