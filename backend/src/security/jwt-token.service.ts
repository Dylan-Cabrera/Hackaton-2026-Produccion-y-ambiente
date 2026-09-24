import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload } from '../interfaces/token-service.interface.js';

// Implementación concreta de ITokenService usando JSON Web Tokens.
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly secret: string = process.env.JWT_SECRET ?? 'secreto_super_seguro_hackathon_2026',
    private readonly expiresIn: string = process.env.JWT_EXPIRES_IN ?? '24h'
  ) {}

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn as any });
  }

  verify(token: string): TokenPayload {
    return jwt.verify(token, this.secret) as TokenPayload;
  }
}
