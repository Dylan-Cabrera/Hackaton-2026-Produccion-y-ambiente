import { Router } from 'express';
import { ProducerController } from '../controllers/producer.controller.js';
import { updateProducerProfileValidator, producerIdValidator } from '../validators/producer.validator.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();
const producerController = new ProducerController();

// Declarada antes de '/:id' para que Express no confunda "profile" con un id
router.put(
  '/profile',
  authenticateToken,
  requireRole('PRODUCER'),
  updateProducerProfileValidator,
  validateRequest,
  producerController.updateProfile
);

// Información pública del emprendimiento
router.get('/:id', producerIdValidator, validateRequest, producerController.getById);

export default router;
