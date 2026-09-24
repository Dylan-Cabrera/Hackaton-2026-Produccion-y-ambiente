import { Request, Response, NextFunction } from 'express';
import { ITokenService, TokenPayload } from '../interfaces/token-service.interface.js';
import { tokenService as defaultTokenService } from '../config/container.js';
import { Role } from '../constants/user.constants.js';

// Interfaz para agregar el usuario autenticado a la petición
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

// Clase en lugar de una función suelta: el middleware depende de ITokenService (DIP),
// no de la librería jwt directamente, por lo que se puede probar con un doble.
export class AuthMiddleware {
  constructor(private readonly tokenService: ITokenService = defaultTokenService) {}

  // Busca el token prioritariamente en la cookie HTTP-Only, o en el header Authorization
  private extractToken(req: Request): string | undefined {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer <token>"

    return cookieToken || headerToken;
  }

  // Requiere sesión activa: responde 401/403 si no hay token o es inválido
  handle = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = this.extractToken(req);

    if (!token) {
      return res.status(401).json({
        message: 'Token de acceso no proporcionado (no hay sesión activa)'
      });
    }

    try {
      req.user = this.tokenService.verify(token);
      return next();
    } catch (error) {
      return res.status(403).json({
        message: 'Token inválido o expirado'
      });
    }
  };

  // Sesión opcional: si hay un token válido completa req.user; si no, sigue como anónimo.
  // Nunca responde 401/403. La usan la telemetría (HU-06/HU-10) y el listado de necesidades (HU-11).
  handleOptional = (req: AuthRequest, _res: Response, next: NextFunction) => {
    const token = this.extractToken(req);

    if (token) {
      try {
        req.user = this.tokenService.verify(token);
      } catch (error) {
        // Token inválido o expirado: se ignora y la petición sigue como anónima
      }
    }

    return next();
  };
}

const authMiddleware = new AuthMiddleware();

// Se exportan las funciones ya ligadas a la instancia para no romper el uso en las rutas
export const authenticateToken = authMiddleware.handle;
export const optionalAuth = authMiddleware.handleOptional;

// Se usa después de authenticateToken: responde 403 si el rol autenticado no está permitido
export const requireRole =
  (...roles: Role[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'No tiene permisos para acceder a este recurso'
      });
    }

    return next();
  };
