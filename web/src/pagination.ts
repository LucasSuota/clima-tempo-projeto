export const PAGE_SIZE = 20;

/** Always at least 1, so an empty list still has a "page 1". */
export function pageCount(total: number, pageSize: number = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function toOffset(page: number, pageSize: number = PAGE_SIZE): number {
  return (page - 1) * pageSize;
}

/** 1-based positions of the first and last item on the page, for "Mostrando a–b de N". */
export function pageRange(
  page: number,
  total: number,
  pageSize: number = PAGE_SIZE,
): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 };
  return { from: toOffset(page, pageSize) + 1, to: Math.min(page * pageSize, total) };
}

/** Brings a page back inside the list, e.g. after deleting the last item of the last page. */
export function clampPage(page: number, total: number, pageSize: number = PAGE_SIZE): number {
  return Math.min(Math.max(page, 1), pageCount(total, pageSize));
}
