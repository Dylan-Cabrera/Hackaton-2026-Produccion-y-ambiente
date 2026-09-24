import { AuthResult, CreateProducerInput, PublicProducerProfile } from './producer.types.js';

export interface IProducerService {
  // Crea el productor y devuelve su perfil público junto con el token de sesión
  register(input: CreateProducerInput): Promise<AuthResult>;
  getPublicById(id: number): Promise<PublicProducerProfile>;
}
