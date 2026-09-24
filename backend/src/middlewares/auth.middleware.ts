import { Request, Response, NextFunction } from 'express';
import { ITokenService, TokenPayload } from '../interfaces/token-service.interface.js';
import { tokenService as defaultTokenService } from '../config/container.js';

// Interfaz para agregar el productor autenticado a la petición
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

// Clase en lugar de una función suelta: el middleware depende de ITokenService (DIP),
// no de la librería jwt directamente, por lo que se puede probar con un doble.
export class AuthMiddleware {
  constructor(private readonly tokenService: ITokenService = defaultTokenService) {}

  handle = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Busca el token prioritariamente en la cookie HTTP-Only, o en el header Authorization
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer <token>"

    const token = cookieToken || headerToken;

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
}

const authMiddleware = new AuthMiddleware();

// Se exporta la función ya ligada a la instancia para no romper el uso en las rutas
export const authenticateToken = authMiddleware.handle;
