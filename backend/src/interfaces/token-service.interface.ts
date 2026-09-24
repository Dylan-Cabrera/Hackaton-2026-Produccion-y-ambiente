export interface TokenPayload {
  id: number;
  email: string;
}

// Abstracción de la emisión/verificación de tokens de sesión.
// Permite reemplazar JWT por otra estrategia sin tocar servicios ni middlewares.
export interface ITokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}
