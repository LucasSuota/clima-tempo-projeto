import { Router } from 'express';
import { z } from 'zod';
import type { ClientService } from '../services/client-service.js';

const requiredText = (max: number) =>
  z
    .string({ error: 'Obrigatório' })
    .trim()
    .min(1, 'Obrigatório')
    .max(max, `Máximo de ${max} caracteres`);

// Absent, null and blank all mean "not informed". Runs before validation so '' is never
// reported as an invalid e-mail or phone.
const optionalText = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) => (value == null || (typeof value === 'string' && value.trim() === '') ? null : value),
    schema.nullable(),
  );

const emailSchema = z
  .string({ error: 'E-mail inválido' })
  .trim()
  .toLowerCase()
  .max(254, 'Máximo de 254 caracteres')
  .pipe(z.email({ error: 'E-mail inválido' }));

// Stored as digits only so the unique constraint ignores formatting differences.
const phoneSchema = z
  .string({ error: 'Telefone inválido' })
  .regex(/^[0-9 ()+-]+$/, 'Telefone inválido')
  .transform((value) => value.replace(/\D/g, ''))
  .pipe(z.string().regex(/^\d{10,15}$/, 'Deve ter de 10 a 15 dígitos'));

const newClientSchema = z.object({
  name: requiredText(120),
  email: optionalText(emailSchema),
  phone: optionalText(phoneSchema),
});

export function clientsRouter(service: ClientService): Router {
  const router = Router();

  router.get('/clients', async (_req, res) => {
    res.json(await service.listClients());
  });

  router.post('/clients', async (req, res) => {
    // `?? {}` so a missing body reports the field errors instead of a generic failure.
    const input = newClientSchema.parse(req.body ?? {});
    res.status(201).json(await service.createClient(input));
  });

  return router;
}
