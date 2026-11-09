import { formatDays } from '../format';

interface StaleIndicatorProps {
  days: number | null;
  className?: string;
}

export function StaleIndicator({ days, className = '' }: StaleIndicatorProps) {
  if (days === null) return null;

  const isCritical = days >= 30;
  const colorClass = isCritical ? 'text-[#A12A2A]' : 'text-[#A34A06]';

  return (
    <span
      className={`text-[13px] leading-[18px] font-semibold whitespace-nowrap ${colorClass} ${className}`}
    >
      Parado há {formatDays(days)}
    </span>
  );
}

// Backwards-compatible export that replaces the old pill badge with the design reference text
export const StaleBadge = StaleIndicator;
