import { ApiError } from './api/client';

export interface SplitErrors {
  fields: Record<string, string>;
  message: string | null;
}

/**
 * Splits an API failure into per-field messages and one general message. Errors for fields the
 * form does not have go to the general message so none is lost.
 */
export function splitErrors(error: unknown, knownFields: readonly string[]): SplitErrors {
  if (!(error instanceof ApiError)) return { fields: {}, message: 'Erro inesperado' };
  if (error.errors.length === 0) return { fields: {}, message: error.detail };

  const fields: Record<string, string> = {};
  const unplaced: string[] = [];
  for (const { field, message } of error.errors) {
    if (!knownFields.includes(field)) unplaced.push(message);
    else if (!(field in fields)) fields[field] = message;
  }
  return { fields, message: unplaced.length > 0 ? unplaced.join(' ') : null };
}

const WITH_COMMA = /^(\d{1,3}(\.\d{3})+|\d+),\d+$/;
const WITHOUT_COMMA = /^\d+(\.\d+)?$/;

/**
 * Reads a money amount typed the Brazilian way. With a comma, dots are thousands separators;
 * without one, the dot is the decimal separator. Positivity and decimal places are the server's.
 */
export function parseMoneyInput(text: string): number | null {
  const cleaned = text.replace(/R\$/g, '').replace(/\s/g, '');
  if (WITH_COMMA.test(cleaned)) return Number(cleaned.replace(/\./g, '').replace(',', '.'));
  if (WITHOUT_COMMA.test(cleaned)) return Number(cleaned);
  return null;
}
