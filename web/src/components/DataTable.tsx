import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  cell: (item: T) => ReactNode;
  /** Skips the "header: value" label in the mobile card (use for the main column). */
  hideLabelOnCard?: boolean;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

interface DataTableProps<T> {
  items: T[];
  columns: Column<T>[];
  getKey: (item: T) => number | string;
  ariaLabel?: string;
}

export function DataTable<T>({ items, columns, getKey, ariaLabel }: DataTableProps<T>) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden w-full overflow-x-auto md:block">
        <table aria-label={ariaLabel} className="w-full border-collapse text-left">
          <thead className="border-b border-[#DDE5EC] bg-[#F4F7FA] text-[13px] leading-[18px] font-semibold text-[#52646F]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  className={`px-5 py-3.5 font-semibold ${
                    column.align === 'right'
                      ? 'text-right'
                      : column.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                  } ${column.className ?? ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7EDF2]">
            {items.map((item) => (
              <tr key={getKey(item)} className="transition-colors hover:bg-[#F4F8FB]">
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={`px-5 py-3 text-sm text-[#0F1F2B] ${
                      column.align === 'right'
                        ? 'text-right tabular-nums'
                        : column.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                    } ${column.className ?? ''}`}
                  >
                    {column.cell(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (without drop shadow, border-only, touch-friendly) */}
      <ul className="divide-y divide-[#E7EDF2] md:hidden">
        {items.map((item) => (
          <li key={getKey(item)} className="space-y-2 p-4 transition-colors hover:bg-[#F4F8FB]">
            {columns.map((column) => (
              <div
                key={column.header}
                className="flex flex-wrap items-baseline justify-between gap-2"
              >
                {!column.hideLabelOnCard && (
                  <span className="text-[13px] font-semibold text-[#52646F]">{column.header}:</span>
                )}
                <div className="text-sm text-[#0F1F2B]">{column.cell(item)}</div>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}
