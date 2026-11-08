import type { QuoteStatus } from '../api/types';
import { QUOTE_STATUS_LABELS } from '../format';

const STATUS_CLASSES: Record<QuoteStatus, string> = {
  draft: 'bg-slate-200 text-slate-800',
  sent: 'bg-sky-100 text-sky-800',
  negotiating: 'bg-indigo-100 text-indigo-800',
  no_response: 'bg-amber-100 text-amber-900',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {QUOTE_STATUS_LABELS[status]}
    </span>
  );
}
