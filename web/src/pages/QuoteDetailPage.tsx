import { useCallback } from 'react';
import { listFollowUps } from '../api/follow-ups';
import { getQuote } from '../api/quotes';
import { AsyncView } from '../components/AsyncView';
import { FollowUpForm } from '../components/FollowUpForm';
import { FollowUpHistory } from '../components/FollowUpHistory';
import { StaleBadge } from '../components/StaleBadge';
import { StatusBadge } from '../components/StatusBadge';
import { StatusChangeForm } from '../components/StatusChangeForm';
import { formatCurrency, formatDate, formatDays } from '../format';
import { useAsync } from '../hooks/useAsync';

export function QuoteDetailPage({ id }: { id: number }) {
  const loadQuote = useCallback(() => getQuote(id), [id]);
  const loadFollowUps = useCallback(() => listFollowUps(id), [id]);
  const quote = useAsync(loadQuote);
  const followUps = useAsync(loadFollowUps);

  // A follow-up changes the days without contact, so both lists are refreshed.
  function handleFollowUpSaved() {
    quote.reload();
    followUps.reload();
  }

  return (
    <section className="space-y-6">
      <a href="#/orcamentos" className="inline-block text-sky-700 underline">
        Voltar para orçamentos
      </a>
      <AsyncView state={quote}>
        {(data) => (
          <>
            <div className="rounded-md bg-white p-4 shadow-sm">
              <h1 className="text-2xl font-bold break-words md:text-3xl">{data.description}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={data.status} />
                {data.isStale && <StaleBadge days={data.daysWithoutContact} />}
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="Cliente" value={data.client.name} />
                <Info label="Responsável" value={`${data.owner.name} (${data.owner.role})`} />
                <Info label="Valor" value={formatCurrency(data.total)} />
                <Info label="Data de envio" value={formatDate(data.sentAt)} />
                {data.daysWithoutContact !== null && (
                  <Info label="Dias sem contato" value={formatDays(data.daysWithoutContact)} />
                )}
              </dl>
            </div>
            <StatusChangeForm quote={data} onChanged={quote.reload} />
            {/* Keyed by status so an error about the old status does not outlive a status change. */}
            <FollowUpForm key={data.status} quoteId={data.id} onSaved={handleFollowUpSaved} />
            <div>
              <h2 className="mb-3 text-lg font-semibold">Histórico de contatos</h2>
              <FollowUpHistory state={followUps} />
            </div>
          </>
        )}
      </AsyncView>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}
