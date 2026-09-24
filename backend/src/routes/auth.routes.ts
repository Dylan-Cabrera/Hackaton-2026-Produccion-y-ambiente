import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { loginValidator } from '../validators/auth.validator.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();
const authController = new AuthController();

// Rutas públicas de autenticación (el registro es POST /api/producers)
router.post('/login', loginValidator, validateRequest, authController.login);
router.post('/logout', authController.logout);

// Ruta protegida (requiere cookie de sesión o Header: Authorization: Bearer <token>)
router.get('/profile', authenticateToken, authController.profile);

export default router;
