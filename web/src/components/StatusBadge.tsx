import type { QuoteStatus } from '../api/types';
import { QUOTE_STATUS_LABELS } from '../format';

interface StatusStyle {
  bg: string;
  fg: string;
}

const STATUS_STYLES: Record<QuoteStatus, StatusStyle> = {
  draft: { bg: 'bg-[#E9EEF2]', fg: 'text-[#52646F]' },
  sent: { bg: 'bg-[#EAF2FA]', fg: 'text-[#144C88]' },
  negotiating: { bg: 'bg-[#ECEBFB]', fg: 'text-[#3730A3]' },
  no_response: { bg: 'bg-[#E9EEF2]', fg: 'text-[#3D4F5C]' },
  won: { bg: 'bg-[#E4F5EA]', fg: 'text-[#14693A]' },
  lost: { bg: 'bg-[#FDECEC]', fg: 'text-[#A12A2A]' },
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  const { bg, fg } = STATUS_STYLES[status] ?? STATUS_STYLES.draft;

  return (
    <span
      className={`inline-block rounded-[4px] px-2 py-0.5 text-[13px] leading-5 font-semibold whitespace-nowrap ${bg} ${fg}`}
    >
      {QUOTE_STATUS_LABELS[status] ?? status}
    </span>
  );
}
