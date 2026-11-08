import express from 'express';
import type { Pool } from 'pg';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { createOwnerRepository } from './repositories/owner-repository.js';
import { apiRouter } from './routes/index.js';
import { createOwnerService } from './services/owner-service.js';

export interface AppDependencies {
  pool: Pool;
}

export function createApp({ pool }: AppDependencies): express.Express {
  const app = express();

  app.use(express.json());
  const ownerService = createOwnerService(createOwnerRepository(pool));
  app.use('/api', apiRouter({ pool, ownerService }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
