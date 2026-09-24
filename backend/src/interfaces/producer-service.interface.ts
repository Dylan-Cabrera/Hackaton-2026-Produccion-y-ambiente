import { PublicProducerProfile, UpdateProducerProfileInput } from './producer.types.js';

export interface IProducerService {
  getPublicById(id: number): Promise<PublicProducerProfile>;
  // userId: id del productor autenticado (siempre edita su propio perfil)
  updateProfile(userId: number, input: UpdateProducerProfileInput): Promise<PublicProducerProfile>;
}
