import { Router, Request, Response, NextFunction } from 'express';
import { validateParams } from '../middleware/validate.middleware.js';
import { PnrRequestParamsSchema } from '../schemas/pnr.schema.js';
import { serviceManager } from '../services/service.manager.js';

export const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).send('Hello Universe!');
});

router.get(
  '/pnrstatus/:serviceId/:pnrNumber',
  validateParams(PnrRequestParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const serviceId = req.params.serviceId as string;
    const pnrNumber = req.params.pnrNumber as string;

    try {
      const result = await serviceManager.execute(serviceId, pnrNumber);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/usage', (_req: Request, res: Response) => {
  res.status(200).send('GET /pnrstatus/{serviceId}/{pnrNumber}');
});

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

export default router;
