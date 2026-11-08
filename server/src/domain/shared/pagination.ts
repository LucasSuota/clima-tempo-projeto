// `limit: null` means "no limit": the Postgres `LIMIT NULL` returns every row, so the same
// query serves paged and unpaged callers.
export interface PageParams {
  limit: number | null;
  offset: number;
}

export const ALL_ROWS: PageParams = { limit: null, offset: 0 };
