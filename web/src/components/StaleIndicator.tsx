import { formatDays, staleTone } from '../format';

interface StaleIndicatorProps {
  days: number | null;
  className?: string;
}

export function StaleIndicator({ days, className = '' }: StaleIndicatorProps) {
  if (days === null) return null;

  const colorClass = staleTone(days) === 'critical' ? 'text-[#A12A2A]' : 'text-[#A34A06]';

  return (
    <span
      className={`text-[13px] leading-[18px] font-semibold whitespace-nowrap ${colorClass} ${className}`}
    >
      Parado há {formatDays(days)}
    </span>
  );
}
