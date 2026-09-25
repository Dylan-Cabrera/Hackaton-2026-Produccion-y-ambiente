import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller.js';
import { b2bRecommendationsValidator, forYouValidator } from '../validators/recommendation.validator.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();
const recommendationController = new RecommendationController();

router.get(
  '/b2b',
  authenticateToken,
  requireRole('PRODUCER'),
  b2bRecommendationsValidator,
  validateRequest,
  recommendationController.b2b
);

router.get(
  '/for-you',
  authenticateToken,
  requireRole('CONSUMER', 'PRODUCER'),
  forYouValidator,
  validateRequest,
  recommendationController.forYou
);

export default router;
