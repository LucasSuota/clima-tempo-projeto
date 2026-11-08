import type { FollowUp, ListResponse } from '../api/types';
import { formatDate } from '../format';
import type { AsyncState } from '../hooks/useAsync';
import { AsyncView } from './AsyncView';
import { EmptyState } from './EmptyState';

export function FollowUpHistory({ state }: { state: AsyncState<ListResponse<FollowUp>> }) {
  return (
    <AsyncView state={state}>
      {(data) =>
        data.items.length === 0 ? (
          <EmptyState title="Nenhum contato registrado" />
        ) : (
          <ul className="space-y-3">
            {data.items.map((followUp) => (
              <li key={followUp.id} className="rounded-md bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-600">
                  {formatDate(followUp.contactedAt)}
                </p>
                <p className="break-words">{followUp.description ?? '—'}</p>
              </li>
            ))}
          </ul>
        )
      }
    </AsyncView>
  );
}
