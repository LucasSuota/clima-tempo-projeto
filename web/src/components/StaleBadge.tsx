import { formatDays } from '../format';

// Shows what the API decided (`isStale`); the text, not only the color, carries the alert.
export function StaleBadge({ days }: { days: number | null }) {
  return (
    <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
      {days === null ? 'Parado' : `Parado há ${formatDays(days)}`}
    </span>
  );
}
