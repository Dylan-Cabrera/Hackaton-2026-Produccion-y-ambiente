import { IProducerService } from '../interfaces/producer-service.interface.js';
import { IProducerRepository } from '../interfaces/producer-repository.interface.js';
import { IUserRepository } from '../interfaces/user-repository.interface.js';
import { PublicProducerProfile, UpdateProducerProfileInput } from '../interfaces/producer.types.js';
import { PublicUserProfile } from '../interfaces/user.types.js';
import { ProducerMapper } from '../mappers/producer.mapper.js';
import { UserMapper } from '../mappers/user.mapper.js';
import { NotFoundError } from '../errors/app-error.js';

// Caso de uso "perfil de productor": lectura pública y edición del propio emprendimiento.
// El alta y la baja de la cuenta viven en AuthService (aplican a cualquier rol).
export class ProducerService implements IProducerService {
  constructor(
    private readonly producerRepository: IProducerRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async getPublicById(id: number): Promise<PublicProducerProfile> {
    const record = await this.producerRepository.findById(id);
    if (!record) {
      throw new NotFoundError('Productor no encontrado');
    }
    return ProducerMapper.toPublic(record);
  }

  async updateProfile(userId: number, input: UpdateProducerProfileInput): Promise<PublicUserProfile> {
    const updated = await this.producerRepository.update(userId, ProducerMapper.toUpdatePersistence(input));
    if (!updated) {
      throw new NotFoundError('Perfil de productor no encontrado');
    }

    // La cuenta completa (con role/email/locality/accountType) sale de `users`, no del
    // registro aplanado de `producerRepository` (que solo trae lo necesario para la vista pública).
    const account = await this.userRepository.findById(userId);
    if (!account) {
      throw new NotFoundError('Usuario no encontrado');
    }
    return UserMapper.toPublic(account, { own: true });
  }
}
