import express from 'express';
import type { Pool } from 'pg';
import { DEFAULT_STALE_DAYS } from './config.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { createClientRepository } from './repositories/client-repository.js';
import { createFollowUpRepository } from './repositories/follow-up-repository.js';
import { createOwnerRepository } from './repositories/owner-repository.js';
import { createQuoteRepository } from './repositories/quote-repository.js';
import { apiRouter } from './routes/index.js';
import { createClientService } from './services/client-service.js';
import { createFollowUpService } from './services/follow-up-service.js';
import { createOwnerService } from './services/owner-service.js';
import { createQuoteService } from './services/quote-service.js';

export interface AppDependencies {
  pool: Pool;
  staleDays?: number;
  // Injected so tests can pin "today"; production uses the real clock.
  now?: () => Date;
}

export function createApp({
  pool,
  staleDays = DEFAULT_STALE_DAYS,
  now = () => new Date(),
}: AppDependencies): express.Express {
  const app = express();

  app.use(express.json());
  const clients = createClientRepository(pool);
  const owners = createOwnerRepository(pool);
  const quotes = createQuoteRepository(pool);
  const followUps = createFollowUpRepository(pool);
  const clientService = createClientService(clients);
  const ownerService = createOwnerService(owners);
  const quoteService = createQuoteService({ quotes, clients, owners, staleDays, now });
  const followUpService = createFollowUpService({ quotes, followUps, now });
  app.use('/api', apiRouter({ pool, clientService, ownerService, quoteService, followUpService }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
