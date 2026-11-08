import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  cell: (item: T) => ReactNode;
  /** Skips the "header: value" label in the mobile card (use for the main column). */
  hideLabelOnCard?: boolean;
}

interface DataTableProps<T> {
  items: T[];
  columns: Column<T>[];
  getKey: (item: T) => number;
}

// One column definition renders a table from `md:` up and a list of cards below it.
export function DataTable<T>({ items, columns, getKey }: DataTableProps<T>) {
  return (
    <>
      <table className="hidden w-full border-collapse overflow-hidden rounded-md bg-white shadow-sm md:table">
        <thead className="bg-slate-100 text-left text-sm text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={column.header} scope="col" className="px-4 py-3 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={getKey(item)} className="border-t border-slate-200 align-top">
              {columns.map((column) => (
                <td key={column.header} className="px-4 py-3 break-words">
                  {column.cell(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <li key={getKey(item)} className="space-y-1 rounded-md bg-white p-4 shadow-sm">
            {columns.map((column) => (
              <div key={column.header} className="break-words">
                {!column.hideLabelOnCard && (
                  <span className="mr-1 text-sm text-slate-500">{column.header}:</span>
                )}
                {column.cell(item)}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}
