import { z } from 'zod';
import type { PageParams } from '../domain/shared/pagination.js';

const MAX_PAGE_SIZE = 100;

// z.coerce.number() would accept '' (as 0), ' ' and '1e2'; digits only avoids that.
const queryInteger = (message: string) =>
  z
    .string({ error: message })
    .regex(/^\d+$/, message)
    .transform(Number)
    .pipe(z.number().max(Number.MAX_SAFE_INTEGER, message));

const paginationSchema = z.object({
  limit: queryInteger('Limite inválido')
    .pipe(
      z
        .number()
        .min(1, `Deve estar entre 1 e ${MAX_PAGE_SIZE}`)
        .max(MAX_PAGE_SIZE, `Deve estar entre 1 e ${MAX_PAGE_SIZE}`),
    )
    .optional(),
  offset: queryInteger('Deslocamento inválido').optional(),
});

// Both parameters are optional: without them the whole list is returned, as before pagination.
export function parsePagination(query: unknown): PageParams {
  const { limit, offset } = paginationSchema.parse(query);
  return { limit: limit ?? null, offset: offset ?? 0 };
}
