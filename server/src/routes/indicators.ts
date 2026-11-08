import { Router } from 'express';
import type { IndicatorService } from '../services/indicator-service.js';

export function indicatorsRouter(service: IndicatorService): Router {
  const router = Router();

  router.get('/indicators', async (_req, res) => {
    res.json(await service.getIndicators());
  });

  return router;
}
