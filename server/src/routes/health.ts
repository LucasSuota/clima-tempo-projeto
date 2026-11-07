import { Router } from 'express';
import type { Pool } from 'pg';

export function healthRouter(pool: Pool): Router {
  const router = Router();

  router.get('/health', async (_req, res) => {
    // Proves the database answers, not just that the process is up.
    await pool.query('SELECT 1');
    res.json({ ok: true });
  });

  return router;
}
