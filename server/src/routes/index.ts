import { Router } from 'express';
import type { Pool } from 'pg';
import { healthRouter } from './health.js';

export function apiRouter(pool: Pool): Router {
  const router = Router();

  router.use(healthRouter(pool));

  return router;
}
