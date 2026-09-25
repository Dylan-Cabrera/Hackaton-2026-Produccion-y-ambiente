import { Router } from 'express';
import { NeedController } from '../controllers/need.controller.js';
import {
  createNeedValidator,
  updateNeedValidator,
  needIdValidator,
  searchNeedsValidator,
  getMatchesValidator
} from '../validators/need.validator.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { authenticateToken, optionalAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();
const needController = new NeedController();

// Público, con sesión opcional: si hay token válido, se aplica la regla de privacidad del teléfono
router.get('/', optionalAuth, searchNeedsValidator, validateRequest, needController.search);

router.post(
  '/',
  authenticateToken,
  requireRole('CONSUMER', 'PRODUCER'),
  createNeedValidator,
  validateRequest,
  needController.create
);

// Declaradas antes de '/:id' para que Express no las confunda con un id
router.get('/mine', authenticateToken, requireRole('CONSUMER', 'PRODUCER'), needController.listMine);
router.get('/for-me', authenticateToken, requireRole('PRODUCER'), needController.forMe);

router.get('/:id', optionalAuth, needIdValidator, validateRequest, needController.getById);

router.patch(
  '/:id',
  authenticateToken,
  requireRole('CONSUMER', 'PRODUCER'),
  needIdValidator,
  updateNeedValidator,
  validateRequest,
  needController.update
);

router.get(
  '/:id/matches',
  authenticateToken,
  requireRole('CONSUMER', 'PRODUCER', 'ADMIN'),
  needIdValidator,
  getMatchesValidator,
  validateRequest,
  needController.getMatches
);

export default router;
