import type { FollowUp, ListResponse } from '../api/types';
import { formatDate } from '../format';
import type { AsyncState } from '../hooks/useAsync';
import { AsyncView } from './AsyncView';
import { EmptyState } from './EmptyState';
import { MissingValue } from './MissingValue';

export function FollowUpHistory({ state }: { state: AsyncState<ListResponse<FollowUp>> }) {
  return (
    <AsyncView state={state}>
      {(data) =>
        data.items.length === 0 ? (
          <EmptyState
            title="Nenhum contato registrado"
            description="Os contatos registrados aparecerão aqui em ordem cronológica."
          />
        ) : (
          <ul className="space-y-3">
            {data.items.map((followUp) => (
              <li
                key={followUp.id}
                className="rounded-[8px] border border-[#DDE5EC] bg-white p-4 transition-colors hover:bg-[#F4F8FB]"
              >
                <div className="flex items-center justify-between text-[13px] font-semibold text-[#52646F]">
                  <span className="tabular-nums">{formatDate(followUp.contactedAt)}</span>
                </div>
                <p className="mt-1 text-sm text-[#0F1F2B] break-words">
                  {followUp.description ?? <MissingValue text="Sem observações adicionais" />}
                </p>
              </li>
            ))}
          </ul>
        )
      }
    </AsyncView>
  );
}
