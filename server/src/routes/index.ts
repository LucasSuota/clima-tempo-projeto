import { Router } from 'express';
import type { Pool } from 'pg';
import type { ClientService } from '../services/client-service.js';
import type { OwnerService } from '../services/owner-service.js';
import { clientsRouter } from './clients.js';
import { healthRouter } from './health.js';
import { ownersRouter } from './owners.js';

export interface ApiDependencies {
  pool: Pool;
  clientService: ClientService;
  ownerService: OwnerService;
}

export function apiRouter({ pool, clientService, ownerService }: ApiDependencies): Router {
  const router = Router();

  router.use(healthRouter(pool));
  router.use(clientsRouter(clientService));
  router.use(ownersRouter(ownerService));

  return router;
}
