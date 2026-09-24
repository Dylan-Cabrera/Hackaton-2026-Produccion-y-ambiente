import { IAuthService } from '../interfaces/auth-service.interface.js';
import { IUserRepository } from '../interfaces/user-repository.interface.js';
import { IPasswordHasher } from '../interfaces/password-hasher.interface.js';
import { ITokenService } from '../interfaces/token-service.interface.js';
import {
  AuthResult,
  LoginInput,
  PublicUserProfile,
  RegisterInput,
  UpdateUserInput,
  UserRecord
} from '../interfaces/user.types.js';
import { UserMapper } from '../mappers/user.mapper.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../errors/app-error.js';

// Caso de uso "cuenta": registro, login y gestión del propio perfil (cualquier rol).
// Depende únicamente de abstracciones (DIP), lo que permite testearlo con dobles
// de prueba sin tocar Sequelize, bcrypt ni jwt.
export class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('El correo electrónico ya se encuentra registrado');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const record = await this.userRepository.create(UserMapper.toPersistence(input, passwordHash));

    return this.buildAuthResult(record);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const invalidCredentials = () =>
      new UnauthorizedError('Credenciales inválidas (email o contraseña incorrectos)');

    const record = await this.userRepository.findByEmail(input.email);
    if (!record) {
      throw invalidCredentials();
    }

    const isPasswordValid = await this.passwordHasher.compare(input.password, record.password);
    if (!isPasswordValid) {
      throw invalidCredentials();
    }

    return this.buildAuthResult(record);
  }

  async getProfile(userId: number): Promise<PublicUserProfile> {
    const record = await this.userRepository.findById(userId);
    if (!record) {
      throw new NotFoundError('Usuario no encontrado');
    }
    return UserMapper.toPublic(record, { own: true });
  }

  async updateProfile(userId: number, input: UpdateUserInput): Promise<PublicUserProfile> {
    const updated = await this.userRepository.update(userId, UserMapper.toUpdatePersistence(input));
    if (!updated) {
      throw new NotFoundError('Usuario no encontrado');
    }
    return UserMapper.toPublic(updated, { own: true });
  }

  async deleteAccount(userId: number): Promise<void> {
    const deleted = await this.userRepository.delete(userId);
    if (!deleted) {
      throw new NotFoundError('Usuario no encontrado');
    }
  }

  // Arma { user, token } para register/login sin repetir sign() + toPublic()
  private buildAuthResult(record: UserRecord): AuthResult {
    const token = this.tokenService.sign({ id: record.id, email: record.email, role: record.role });
    return { user: UserMapper.toPublic(record, { own: true }), token };
  }
}
