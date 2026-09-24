// Abstracción del hashing de contraseñas (Dependency Inversion Principle):
// los servicios dependen de este contrato, no de bcrypt directamente.
export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
