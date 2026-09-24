import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { updateUserValidator } from '../validators/user.validator.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();
const authController = new AuthController();

// Edita los datos de cuenta propios (cualquier rol)
router.put('/me', authenticateToken, updateUserValidator, validateRequest, authController.updateProfile);

// Elimina la cuenta propia; en cascada se borran el perfil de productor y, a futuro, sus datos relacionados
router.delete('/me', authenticateToken, authController.deleteAccount);

export default router;
