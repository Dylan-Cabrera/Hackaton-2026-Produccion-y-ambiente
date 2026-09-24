import { IProducerService } from '../interfaces/producer-service.interface.js';
import { IProducerRepository } from '../interfaces/producer-repository.interface.js';
import { IPasswordHasher } from '../interfaces/password-hasher.interface.js';
import { ITokenService } from '../interfaces/token-service.interface.js';
import {
  AuthResult,
  CreateProducerInput,
  PublicProducerProfile,
  UpdateProducerInput
} from '../interfaces/producer.types.js';
import { ProducerMapper } from '../mappers/producer.mapper.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../errors/app-error.js';

// Caso de uso "registrar productor". Depende únicamente de abstracciones (DIP),
// lo que permite testearlo con dobles de prueba sin tocar Sequelize, bcrypt ni jwt.
export class ProducerService implements IProducerService {
  constructor(
    private readonly producerRepository: IProducerRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  async register(input: CreateProducerInput): Promise<AuthResult> {
    // 1. Verificar si el email ya existe
    const existing = await this.producerRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('El correo electrónico ya se encuentra registrado');
    }

    // 2. Encriptar contraseña y persistir
    const passwordHash = await this.passwordHasher.hash(input.password);
    const record = await this.producerRepository.create(
      ProducerMapper.toPersistence(input, passwordHash)
    );

    // 3. Iniciar sesión automáticamente tras el registro
    const token = this.tokenService.sign({ id: record.id, email: record.email, role: 'PRODUCER' });

    return { producer: ProducerMapper.toPublic(record, { includeEmail: true }), token };
  }

  async getPublicById(id: number): Promise<PublicProducerProfile> {
    const record = await this.producerRepository.findById(id);

    if (!record) {
      throw new NotFoundError('Productor no encontrado');
    }

    return ProducerMapper.toPublic(record);
  }

  async update(id: number, requesterId: number, input: UpdateProducerInput): Promise<PublicProducerProfile> {
    const record = await this.producerRepository.findById(id);
    if (!record) {
      throw new NotFoundError('Productor no encontrado');
    }
    if (record.id !== requesterId) {
      throw new ForbiddenError('No tiene permisos para modificar este productor');
    }

    const updated = await this.producerRepository.update(id, ProducerMapper.toUpdatePersistence(input));
    if (!updated) {
      throw new NotFoundError('Productor no encontrado');
    }

    return ProducerMapper.toPublic(updated, { includeEmail: true });
  }

  async remove(id: number, requesterId: number): Promise<void> {
    const record = await this.producerRepository.findById(id);
    if (!record) {
      throw new NotFoundError('Productor no encontrado');
    }
    if (record.id !== requesterId) {
      throw new ForbiddenError('No tiene permisos para eliminar este productor');
    }

    await this.producerRepository.delete(id);
  }
}
