import { pageCount, pageRange } from '../pagination';

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  resourceName?: string;
}

function getVisiblePages(current: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, '…', totalPages];
  }

  if (current >= totalPages - 3) {
    return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '…', current - 1, current, current + 1, '…', totalPages];
}

export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  resourceName = 'itens',
}: PaginationProps) {
  if (total === 0) return null;

  const totalPages = pageCount(total, pageSize);
  const { from, to } = pageRange(page, total, pageSize);
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DDE5EC] bg-white px-5 py-3">
      <span className="text-[13px] leading-[18px] text-[#52646F]">
        Mostrando{' '}
        <span className="font-semibold text-[#0F1F2B]">
          {from}–{to}
        </span>{' '}
        de <span className="font-semibold text-[#0F1F2B]">{total}</span> {resourceName}
      </span>

      <nav aria-label="Paginação" className="flex flex-wrap items-center gap-1">
        {/* Previous Page Button */}
        <button
          type="button"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-[6px] border text-[#0F1F2B] transition-colors ${
            page <= 1
              ? 'cursor-not-allowed border-[#DDE5EC] bg-[#F4F7FA] text-[#5F707B]'
              : 'border-[#C3CFD9] bg-white hover:bg-[#EAF2FA]'
          }`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Page Buttons */}
        {visiblePages.map((item, index) => {
          if (item === '…') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex h-11 min-w-11 items-center justify-center text-sm font-semibold text-[#52646F]"
              >
                …
              </span>
            );
          }

          const isActive = item === page;
          return (
            <button
              key={item}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Página ${item}`}
              onClick={() => onPageChange(item)}
              className={`inline-flex h-11 min-w-11 items-center justify-center rounded-[6px] px-2 text-sm font-semibold tabular-nums transition-colors ${
                isActive
                  ? 'border border-[#1B5FA6] bg-[#1B5FA6] text-white'
                  : 'border border-[#C3CFD9] bg-white text-[#0F1F2B] hover:bg-[#EAF2FA]'
              }`}
            >
              {item}
            </button>
          );
        })}

        {/* Next Page Button */}
        <button
          type="button"
          aria-label="Próxima página"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-[6px] border text-[#0F1F2B] transition-colors ${
            page >= totalPages
              ? 'cursor-not-allowed border-[#DDE5EC] bg-[#F4F7FA] text-[#5F707B]'
              : 'border-[#C3CFD9] bg-white hover:bg-[#EAF2FA]'
          }`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </nav>
    </div>
  );
}
