import { Router } from 'express';
import { z } from 'zod';
import type { OwnerService } from '../services/owner-service.js';

const requiredText = (max: number) =>
  z
    .string({ error: 'Obrigatório' })
    .trim()
    .min(1, 'Obrigatório')
    .max(max, `Máximo de ${max} caracteres`);

const newOwnerSchema = z.object({
  name: requiredText(120),
  role: requiredText(80),
});

export function ownersRouter(service: OwnerService): Router {
  const router = Router();

  router.get('/owners', async (_req, res) => {
    res.json(await service.listOwners());
  });

  router.post('/owners', async (req, res) => {
    // `?? {}` so a missing body reports the field errors instead of a generic failure.
    const input = newOwnerSchema.parse(req.body ?? {});
    res.status(201).json(await service.createOwner(input));
  });

  return router;
}
