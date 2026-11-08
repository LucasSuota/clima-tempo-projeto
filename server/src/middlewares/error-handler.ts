import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { DomainError, ValidationError } from '../errors.js';

// body-parser (express.json) fails with a SyntaxError carrying this type on malformed JSON.
function isMalformedJson(error: unknown): boolean {
  return (
    error instanceof SyntaxError && (error as { type?: unknown }).type === 'entity.parse.failed'
  );
}

function fromZodError(error: ZodError): ValidationError {
  return new ValidationError(
    error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
  );
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ detail: 'Recurso não encontrado', errors: [] });
};

// Express recognises an error handler by its four parameters, so `_next` must stay.
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  let known: DomainError | undefined;
  if (error instanceof DomainError) known = error;
  else if (error instanceof ZodError) known = fromZodError(error);
  else if (isMalformedJson(error)) known = new ValidationError();

  if (known) {
    res.status(known.status).json({ detail: known.detail, errors: known.errors });
    return;
  }

  // Only the server log sees the real error; the client gets a generic message (AGENTS.md §12).
  // eslint-disable-next-line no-console
  console.error(error);
  res.status(500).json({ detail: 'Erro interno do servidor', errors: [] });
};
