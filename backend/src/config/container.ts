// Composition root: único lugar donde se instancian las clases concretas
// y se cablean unas con otras. El resto de la app solo importa las interfaces.
import { SequelizeUserRepository } from '../repositories/user.repository.js';
import { SequelizeProducerRepository } from '../repositories/producer.repository.js';
import { BcryptPasswordHasher } from '../security/bcrypt-password-hasher.js';
import { JwtTokenService } from '../security/jwt-token.service.js';
import { ProducerService } from '../services/producer.service.js';
import { AuthService } from '../services/auth.service.js';
import { IUserRepository } from '../interfaces/user-repository.interface.js';
import { IProducerRepository } from '../interfaces/producer-repository.interface.js';
import { IPasswordHasher } from '../interfaces/password-hasher.interface.js';
import { ITokenService } from '../interfaces/token-service.interface.js';
import { IProducerService } from '../interfaces/producer-service.interface.js';
import { IAuthService } from '../interfaces/auth-service.interface.js';

export const userRepository: IUserRepository = new SequelizeUserRepository();
export const producerRepository: IProducerRepository = new SequelizeProducerRepository();
export const passwordHasher: IPasswordHasher = new BcryptPasswordHasher();
export const tokenService: ITokenService = new JwtTokenService();

export const producerService: IProducerService = new ProducerService(producerRepository);

export const authService: IAuthService = new AuthService(userRepository, passwordHasher, tokenService);
