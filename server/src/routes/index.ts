import { Router } from 'express';
import type { Pool } from 'pg';
import type { OwnerService } from '../services/owner-service.js';
import { healthRouter } from './health.js';
import { ownersRouter } from './owners.js';

export interface ApiDependencies {
  pool: Pool;
  ownerService: OwnerService;
}

export function apiRouter({ pool, ownerService }: ApiDependencies): Router {
  const router = Router();

  router.use(healthRouter(pool));
  router.use(ownersRouter(ownerService));

  return router;
}
