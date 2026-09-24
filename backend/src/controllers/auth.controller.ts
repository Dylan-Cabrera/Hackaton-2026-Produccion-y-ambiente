import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../interfaces/auth-service.interface.js';
import { authService as defaultAuthService } from '../config/container.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { getCookieOptions } from '../utils/cookie-options.js';

// Adaptador HTTP sobre los casos de uso de cuenta (register/login/logout/profile/update/delete).
// Se monta tanto en /api/auth/* como en /api/users/me (misma instancia, dos rutas).
export class AuthController {
  constructor(private readonly authService: IAuthService = defaultAuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, token } = await this.authService.register(req.body);

      // Guarda el token en una cookie HTTP-Only segura
      res.cookie('token', token, getCookieOptions());

      return res.status(201).json({
        message: 'Cuenta creada exitosamente',
        data: { user, token }
      });
    } catch (error) {
      return next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.login(req.body);

      res.cookie('token', result.token, getCookieOptions());

      return res.status(200).json({
        message: 'Inicio de sesión exitoso',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  };

  logout = async (_req: Request, res: Response) => {
    res.clearCookie('token', getCookieOptions());

    return res.status(200).json({
      message: 'Sesión cerrada exitosamente'
    });
  };

  profile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await this.authService.getProfile(req.user!.id);

      return res.status(200).json({
        message: 'Perfil obtenido exitosamente',
        data: user
      });
    } catch (error) {
      return next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await this.authService.updateProfile(req.user!.id, req.body);

      return res.status(200).json({
        message: 'Perfil actualizado exitosamente',
        data: user
      });
    } catch (error) {
      return next(error);
    }
  };

  deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.authService.deleteAccount(req.user!.id);

      res.clearCookie('token', getCookieOptions());

      return res.status(200).json({
        message: 'Cuenta eliminada exitosamente'
      });
    } catch (error) {
      return next(error);
    }
  };
}
