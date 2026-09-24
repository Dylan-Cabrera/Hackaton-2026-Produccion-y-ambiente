import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../interfaces/auth-service.interface.js';
import { authService as defaultAuthService } from '../config/container.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { getCookieOptions } from '../utils/cookie-options.js';
import { AppError } from '../errors/app-error.js';

export class AuthController {
  constructor(private readonly authService: IAuthService = defaultAuthService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.login(req.body);

      // Guarda el token en una cookie HTTP-Only segura
      res.cookie('token', result.token, getCookieOptions());

      return res.status(200).json({
        message: 'Inicio de sesión exitoso',
        data: result
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return next(error);
    }
  };

  profile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const producer = await this.authService.getProfile(req.user.id);
      return res.status(200).json({
        message: 'Perfil obtenido exitosamente',
        data: producer
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return next(error);
    }
  };

  logout = async (_req: Request, res: Response) => {
    // Elimina la cookie del navegador
    res.clearCookie('token', getCookieOptions());

    return res.status(200).json({
      message: 'Sesión cerrada exitosamente'
    });
  };
}
