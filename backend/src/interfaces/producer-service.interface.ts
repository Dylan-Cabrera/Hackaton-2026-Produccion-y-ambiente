import { PublicProducerProfile, UpdateProducerProfileInput } from './producer.types.js';
import { PublicUserProfile } from './user.types.js';

export interface IProducerService {
  getPublicById(id: number): Promise<PublicProducerProfile>;
  // userId: id del productor autenticado (siempre edita su propio perfil).
  // Devuelve la cuenta completa (igual que PUT /api/users/me), no solo la vista pública del
  // emprendimiento, para que el cliente pueda refrescar su sesión sin perder role/email/locality.
  updateProfile(userId: number, input: UpdateProducerProfileInput): Promise<PublicUserProfile>;
}
