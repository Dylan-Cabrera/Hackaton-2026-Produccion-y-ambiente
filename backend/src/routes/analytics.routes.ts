import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { producerDemandValidator } from '../validators/analytics.validator.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();
const analyticsController = new AnalyticsController();

router.get(
  '/producer-demand',
  authenticateToken,
  requireRole('PRODUCER'),
  producerDemandValidator,
  validateRequest,
  analyticsController.producerDemand
);

export default router;
