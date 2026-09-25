import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import {
  producerDemandValidator,
  adminSummaryValidator,
  unmetDemandMapValidator,
  demandHeatValidator,
  trendsValidator
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

// Público: solo datos agregados por celdas de ~2 km y por localidad, nunca eventos individuales
router.get('/demand-heat', demandHeatValidator, validateRequest, analyticsController.demandHeat);

// Solo ADMIN: tendencias generales de toda la plataforma (conteos agregados por día, rubro,
// producto, término y localidad). Incluye visitas y contactos por producto de cada productor.
router.get(
  '/trends',
  authenticateToken,
  requireRole('ADMIN'),
  trendsValidator,
  validateRequest,
  analyticsController.trends
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
