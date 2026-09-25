import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload } from '../interfaces/token-service.interface.js';

const MIN_SECRET_LENGTH = 32;
const ALGORITHM = 'HS256';

// Sin valor por defecto a propósito: un secreto escrito en el código es público para
// cualquiera con acceso al repo y permite firmar sesiones válidas de cualquier usuario.
function requireSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET no está configurado o tiene menos de ${MIN_SECRET_LENGTH} caracteres. ` +
        'Generá uno con: openssl rand -hex 48'
    );
  }
  return secret;
}

// Implementación concreta de ITokenService usando JSON Web Tokens.
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly secret: string = requireSecret(),
    private readonly expiresIn: string = process.env.JWT_EXPIRES_IN ?? '24h'
  ) {}

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { algorithm: ALGORITHM, expiresIn: this.expiresIn as any });
  }

  verify(token: string): TokenPayload {
    return jwt.verify(token, this.secret, { algorithms: [ALGORITHM] }) as TokenPayload;
  }
}
