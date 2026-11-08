import express from 'express';
import type { Pool } from 'pg';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { apiRouter } from './routes/index.js';

export interface AppDependencies {
  pool: Pool;
}

export function createApp({ pool }: AppDependencies): express.Express {
  const app = express();

  app.use(express.json());
  app.use('/api', apiRouter(pool));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
