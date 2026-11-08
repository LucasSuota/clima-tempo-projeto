import { pageCount, pageRange } from '../pagination';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, total, pageSize, onPageChange }: PaginationProps) {
  // A single page needs no controls.
  if (total <= pageSize) return null;

  const pages = pageCount(total, pageSize);
  const { from, to } = pageRange(page, total, pageSize);

  return (
    <nav
      aria-label="Paginação"
      className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
    >
      <p aria-live="polite" className="text-center text-sm text-slate-600">
        Mostrando {from}–{to} de {total} · Página {page} de {pages}
      </p>
      <div className="flex w-full gap-2 sm:w-auto">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Anterior
        </Button>
        <Button variant="secondary" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Próxima
        </Button>
      </div>
    </nav>
  );
}
