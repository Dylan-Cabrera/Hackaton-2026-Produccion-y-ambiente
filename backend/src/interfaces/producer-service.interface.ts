import { AuthResult, CreateProducerInput, PublicProducerProfile, UpdateProducerInput } from './producer.types.js';

export interface IProducerService {
  // Crea el productor y devuelve su perfil público junto con el token de sesión
  register(input: CreateProducerInput): Promise<AuthResult>;
  getPublicById(id: number): Promise<PublicProducerProfile>;
  // requesterId: id del productor autenticado (dueño del recurso) según el token
  update(id: number, requesterId: number, input: UpdateProducerInput): Promise<PublicProducerProfile>;
  remove(id: number, requesterId: number): Promise<void>;
}
