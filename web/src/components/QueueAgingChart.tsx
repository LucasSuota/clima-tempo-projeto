import type { Quote } from '../api/types';
import { groupQueueByAge } from '../charts';
import { formatCurrency } from '../format';

function quoteCount(count: number): string {
  return `${count} ${count === 1 ? 'orçamento' : 'orçamentos'}`;
}

// Horizontal bars, one per band, scaled to the biggest band. The values are also written next
// to each bar, so the chart reads without the colors and the list is its own text equivalent.
export function QueueAgingChart({ items }: { items: Quote[] }) {
  const bands = groupQueueByAge(items);
  const maxCount = Math.max(...bands.map((band) => band.count), 1);

  return (
    <div className="rounded-[8px] border border-[#DDE5EC] bg-white p-5">
      <h3 id="queue-aging-title" className="text-sm font-semibold text-[#0F1F2B]">
        Há quanto tempo estão sem contato
      </h3>
      <ul aria-labelledby="queue-aging-title" className="mt-3 flex flex-col gap-3">
        {bands.map((band) => (
          <li
            key={band.label}
            className="grid grid-cols-[7.5rem_1fr] items-center gap-x-3 gap-y-1 sm:grid-cols-[8.5rem_1fr_auto]"
          >
            <span className="text-[13px] leading-[18px] font-medium text-[#31424F]">
              {band.label}
            </span>
            <div className="h-2.5 rounded-full bg-[#F4F7FA]">
              {band.count > 0 && (
                <div
                  className="h-full rounded-full bg-[#A34A06]"
                  style={{ width: `${(band.count / maxCount) * 100}%` }}
                />
              )}
            </div>
            <span className="col-start-2 text-[13px] leading-[18px] text-[#52646F] tabular-nums sm:col-start-auto sm:text-right">
              <span className="font-semibold whitespace-nowrap text-[#0F1F2B]">
                {quoteCount(band.count)}
              </span>
              {band.count > 0 && (
                <span className="whitespace-nowrap"> · {formatCurrency(band.total)}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
