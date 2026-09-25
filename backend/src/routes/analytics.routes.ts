import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import {
  producerDemandValidator,
  adminSummaryValidator,
  unmetDemandMapValidator
} from '../validators/analytics.validator.js';
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

router.get(
  '/admin-summary',
  authenticateToken,
  requireRole('ADMIN'),
  adminSummaryValidator,
  validateRequest,
  analyticsController.adminSummary
);

router.get(
  '/unmet-demand-map',
  authenticateToken,
  requireRole('ADMIN'),
  unmetDemandMapValidator,
  validateRequest,
  analyticsController.unmetDemandMap
);

export default router;
