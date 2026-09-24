import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { registerValidator, loginValidator } from '../validators/auth.validator.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();
const authController = new AuthController();

// Registro único para CONSUMER y PRODUCER (ADMIN no se puede registrar)
router.post('/register', registerValidator, validateRequest, authController.register);
router.post('/login', loginValidator, validateRequest, authController.login);
router.post('/logout', authController.logout);

// Ruta protegida (requiere cookie de sesión o Header: Authorization: Bearer <token>)
router.get('/profile', authenticateToken, authController.profile);

export default router;
