import { Router } from 'express';
import type { Pool } from 'pg';
import type { ClientService } from '../services/client-service.js';
import type { FollowUpService } from '../services/follow-up-service.js';
import type { OwnerService } from '../services/owner-service.js';
import type { QuoteService } from '../services/quote-service.js';
import { clientsRouter } from './clients.js';
import { followUpsRouter } from './follow-ups.js';
import { healthRouter } from './health.js';
import { ownersRouter } from './owners.js';
import { quotesRouter } from './quotes.js';

export interface ApiDependencies {
  pool: Pool;
  clientService: ClientService;
  ownerService: OwnerService;
  quoteService: QuoteService;
  followUpService: FollowUpService;
}

export function apiRouter({
  pool,
  clientService,
  ownerService,
  quoteService,
  followUpService,
}: ApiDependencies): Router {
  const router = Router();

  router.use(healthRouter(pool));
  router.use(clientsRouter(clientService));
  router.use(ownersRouter(ownerService));
  router.use(quotesRouter(quoteService));
  router.use(followUpsRouter(followUpService));

  return router;
}
