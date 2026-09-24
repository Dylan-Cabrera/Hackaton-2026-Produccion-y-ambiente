import { Router } from 'express';
import { ProducerController } from '../controllers/producer.controller.js';
import {
  registerProducerValidator,
  updateProducerValidator,
  producerIdValidator
} from '../validators/producer.validator.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();
const producerController = new ProducerController();

// Registro de productor (crea la cuenta e inicia sesión)
router.post('/', registerProducerValidator, validateRequest, producerController.create);

// Información pública del emprendimiento
router.get('/:id', producerIdValidator, validateRequest, producerController.getById);

// Actualización del perfil (requiere sesión activa; solo el dueño puede editarlo)
router.patch(
  '/:id',
  authenticateToken,
  producerIdValidator,
  updateProducerValidator,
  validateRequest,
  producerController.update
);

// Eliminación de la cuenta (requiere sesión activa; solo el dueño puede eliminarla)
router.delete('/:id', authenticateToken, producerIdValidator, validateRequest, producerController.remove);

export default router;
