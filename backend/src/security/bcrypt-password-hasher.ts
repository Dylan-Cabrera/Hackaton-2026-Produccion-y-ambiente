import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../interfaces/password-hasher.interface.js';

// Implementación concreta de IPasswordHasher usando bcrypt.
// Se puede sustituir por otra (argon2, etc.) sin tocar los servicios que la consumen.
export class BcryptPasswordHasher implements IPasswordHasher {
  constructor(private readonly saltRounds: number = 10) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
