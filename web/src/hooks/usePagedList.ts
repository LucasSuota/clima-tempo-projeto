import { useCallback } from 'react';
import type { ListResponse, PageQuery } from '../api/types';
import { PAGE_SIZE, clampPage, pageCount, toOffset } from '../pagination';
import { useAsync, type AsyncState } from './useAsync';

export interface PagedListState<T> extends AsyncState<ListResponse<T>> {
  page: number;
  setPage: (page: number) => void;
}

/**
 * Loads one page of a list endpoint. `fetchPage` must be stable (a module-level function).
 * The caller owns `page` (so it can be persisted along with the search and filter).
 */
export function usePagedList<T>(
  fetchPage: (page: PageQuery) => Promise<ListResponse<T>>,
  page: number,
  setPage: (page: number) => void,
): PagedListState<T> {
  const load = useCallback(
    () => fetchPage({ limit: PAGE_SIZE, offset: toOffset(page) }),
    [fetchPage, page],
  );
  const state = useAsync(load);

  // After a delete the current page may no longer exist. Adjusting state during render
  // (instead of in an effect) avoids rendering an empty page first.
  if (state.data !== undefined && !state.loading && page > pageCount(state.data.total)) {
    setPage(clampPage(page, state.data.total));
  }

  return { ...state, page, setPage };
}
