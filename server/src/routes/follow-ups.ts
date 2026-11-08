import { Router } from 'express';
import { z } from 'zod';
import type { FollowUpService } from '../services/follow-up-service.js';
import { parsePagination } from './pagination.js';
import { calendarDateSchema, parseId } from './quotes.js';

const newFollowUpSchema = z.object({
  contactedAt: calendarDateSchema.optional(),
  // Absent, null and blank all mean "no description".
  description: z.preprocess(
    (value) => (value == null || (typeof value === 'string' && value.trim() === '') ? null : value),
    z
      .string({ error: 'Descrição inválida' })
      .trim()
      .max(500, 'Máximo de 500 caracteres')
      .nullable(),
  ),
});

export function followUpsRouter(service: FollowUpService): Router {
  const router = Router();

  router.get('/quotes/:id/follow-ups', async (req, res) => {
    const quoteId = parseId(req.params.id);
    res.json(await service.listFollowUps(quoteId, parsePagination(req.query)));
  });

  router.post('/quotes/:id/follow-ups', async (req, res) => {
    const quoteId = parseId(req.params.id);
    const input = newFollowUpSchema.parse(req.body ?? {});
    res.status(201).json(await service.createFollowUp(quoteId, input));
  });

  return router;
}
