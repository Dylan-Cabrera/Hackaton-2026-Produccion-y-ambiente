import { IProducerService } from '../interfaces/producer-service.interface.js';
import { IProducerRepository } from '../interfaces/producer-repository.interface.js';
import { PublicProducerProfile, UpdateProducerProfileInput } from '../interfaces/producer.types.js';
import { ProducerMapper } from '../mappers/producer.mapper.js';
import { NotFoundError } from '../errors/app-error.js';

// Caso de uso "perfil de productor": lectura pública y edición del propio emprendimiento.
// El alta y la baja de la cuenta viven en AuthService (aplican a cualquier rol).
export class ProducerService implements IProducerService {
  constructor(private readonly producerRepository: IProducerRepository) {}

  async getPublicById(id: number): Promise<PublicProducerProfile> {
    const record = await this.producerRepository.findById(id);
    if (!record) {
      throw new NotFoundError('Productor no encontrado');
    }
    return ProducerMapper.toPublic(record);
  }

  async updateProfile(userId: number, input: UpdateProducerProfileInput): Promise<PublicProducerProfile> {
    const updated = await this.producerRepository.update(userId, ProducerMapper.toUpdatePersistence(input));
    if (!updated) {
      throw new NotFoundError('Perfil de productor no encontrado');
    }
    return ProducerMapper.toPublic(updated);
  }
}
