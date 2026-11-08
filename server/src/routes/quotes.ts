import { Router } from 'express';
import { z } from 'zod';
import { QUOTE_STATUSES } from '../domain/quotes/quote-status.js';
import { QuoteNotFoundError } from '../errors.js';
import type { QuoteService } from '../services/quote-service.js';

// Format only; whether the day exists and is not in the future is a domain rule.
export const calendarDateSchema = z
  .string({ error: 'Data inválida' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida');

const positiveId = (message: string) =>
  z.number({ error: message }).int(message).positive(message).max(Number.MAX_SAFE_INTEGER, message);

// Rounding to cents and comparing proves "at most 2 decimals" without multipleOf(0.01),
// which fails on floating-point values such as 0.07.
const hasAtMostTwoDecimals = (value: number) => Math.round(value * 100) / 100 === value;

const newQuoteSchema = z.object({
  clientId: positiveId('Cliente inválido'),
  ownerId: positiveId('Responsável inválido'),
  description: z
    .string({ error: 'Obrigatório' })
    .trim()
    .min(1, 'Obrigatório')
    .max(500, 'Máximo de 500 caracteres'),
  total: z
    .number({ error: 'Valor inválido' })
    .gt(0, 'Deve ser maior que zero')
    .max(9999999999.99, 'Valor máximo excedido')
    .refine(hasAtMostTwoDecimals, 'Use no máximo 2 casas decimais'),
  status: z.enum(['draft', 'sent'], { error: 'Status inválido' }).default('draft'),
  sentAt: calendarDateSchema.optional(),
});

const statusChangeSchema = z
  .object({
    status: z.enum(QUOTE_STATUSES, { error: 'Status inválido' }),
    sentAt: calendarDateSchema.optional(),
  })
  .refine((body) => body.sentAt === undefined || body.status === 'sent', {
    path: ['sentAt'],
    message: 'Só se aplica ao status enviado',
  });

// A malformed id cannot match any quote, so it answers 404 like a missing one.
export function parseId(raw: string): number {
  const id = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(id) || id <= 0) throw new QuoteNotFoundError();
  return id;
}

export function quotesRouter(service: QuoteService): Router {
  const router = Router();

  router.get('/quotes', async (_req, res) => {
    res.json(await service.listQuotes());
  });

  router.get('/quotes/:id', async (req, res) => {
    res.json(await service.getQuote(parseId(req.params.id)));
  });

  router.post('/quotes', async (req, res) => {
    const input = newQuoteSchema.parse(req.body ?? {});
    res.status(201).json(await service.createQuote({ ...input, sentAt: input.sentAt ?? null }));
  });

  router.patch('/quotes/:id/status', async (req, res) => {
    const id = parseId(req.params.id);
    const { status, sentAt } = statusChangeSchema.parse(req.body ?? {});
    res.json(await service.changeQuoteStatus(id, { status, sentAt: sentAt ?? null }));
  });

  return router;
}
