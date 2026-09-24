import { IAuthService } from '../interfaces/auth-service.interface.js';
import { IProducerRepository } from '../interfaces/producer-repository.interface.js';
import { IPasswordHasher } from '../interfaces/password-hasher.interface.js';
import { ITokenService } from '../interfaces/token-service.interface.js';
import { AuthResult, LoginInput, PublicProducerProfile } from '../interfaces/producer.types.js';
import { ProducerMapper } from '../mappers/producer.mapper.js';
import { NotFoundError, UnauthorizedError } from '../errors/app-error.js';

// Caso de uso "iniciar sesión / ver perfil propio". Comparte las mismas abstracciones
// que ProducerService pero no depende de él (evita acoplar dos servicios de dominio entre sí).
export class AuthService implements IAuthService {
  constructor(
    private readonly producerRepository: IProducerRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  async login(input: LoginInput): Promise<AuthResult> {
    const invalidCredentials = () =>
      new UnauthorizedError('Credenciales inválidas (email o contraseña incorrectos)');

    // 1. Buscar productor por email
    const record = await this.producerRepository.findByEmail(input.email);
    if (!record) {
      throw invalidCredentials();
    }

    // 2. Comparar la contraseña ingresada con el hash guardado
    const isPasswordValid = await this.passwordHasher.compare(input.password, record.password);
    if (!isPasswordValid) {
      throw invalidCredentials();
    }

    // 3. Generar token de sesión
    const token = this.tokenService.sign({ id: record.id, email: record.email });

    return { producer: ProducerMapper.toPublic(record, { includeEmail: true }), token };
  }

  async getProfile(producerId: number): Promise<PublicProducerProfile> {
    const record = await this.producerRepository.findById(producerId);

    if (!record) {
      throw new NotFoundError('Productor no encontrado');
    }

    return ProducerMapper.toPublic(record, { includeEmail: true });
  }
}
