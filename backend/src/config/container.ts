// Composition root: único lugar donde se instancian las clases concretas
// y se cablean unas con otras. El resto de la app solo importa las interfaces.
import { SequelizeUserRepository } from '../repositories/user.repository.js';
import { SequelizeProducerRepository } from '../repositories/producer.repository.js';
import { SequelizeProductRepository } from '../repositories/product.repository.js';
import { SequelizeTelemetryRepository } from '../repositories/telemetry.repository.js';
import { SequelizeAnalyticsRepository } from '../repositories/analytics.repository.js';
import { SequelizeNeedRepository } from '../repositories/need.repository.js';
import { BcryptPasswordHasher } from '../security/bcrypt-password-hasher.js';
import { JwtTokenService } from '../security/jwt-token.service.js';
import { ProducerService } from '../services/producer.service.js';
import { AuthService } from '../services/auth.service.js';
import { ProductService } from '../services/product.service.js';
import { RecommendationService } from '../services/recommendation.service.js';
import { TelemetryService } from '../services/telemetry.service.js';
import { AnalyticsService } from '../services/analytics.service.js';
import { NeedService } from '../services/need.service.js';
import { NeedMatchingService } from '../services/need-matching.service.js';
import { IUserRepository } from '../interfaces/user-repository.interface.js';
import { IProducerRepository } from '../interfaces/producer-repository.interface.js';
import { IProductRepository } from '../interfaces/product-repository.interface.js';
import { ITelemetryRepository } from '../interfaces/telemetry-repository.interface.js';
import { IAnalyticsRepository } from '../interfaces/analytics-repository.interface.js';
import { INeedRepository } from '../interfaces/need-repository.interface.js';
import { IPasswordHasher } from '../interfaces/password-hasher.interface.js';
import { ITokenService } from '../interfaces/token-service.interface.js';
import { IProducerService } from '../interfaces/producer-service.interface.js';
import { IAuthService } from '../interfaces/auth-service.interface.js';
import { IProductService } from '../interfaces/product-service.interface.js';
import { IRecommendationService } from '../interfaces/recommendation-service.interface.js';
import { ITelemetryService } from '../interfaces/telemetry-service.interface.js';
import { IAnalyticsService } from '../interfaces/analytics-service.interface.js';
import { INeedService } from '../interfaces/need-service.interface.js';
import { INeedMatchingService } from '../interfaces/need-matching-service.interface.js';

export const userRepository: IUserRepository = new SequelizeUserRepository();
export const producerRepository: IProducerRepository = new SequelizeProducerRepository();
export const productRepository: IProductRepository = new SequelizeProductRepository();
export const telemetryRepository: ITelemetryRepository = new SequelizeTelemetryRepository();
export const analyticsRepository: IAnalyticsRepository = new SequelizeAnalyticsRepository();
export const needRepository: INeedRepository = new SequelizeNeedRepository();
export const passwordHasher: IPasswordHasher = new BcryptPasswordHasher();
export const tokenService: ITokenService = new JwtTokenService();

export const producerService: IProducerService = new ProducerService(producerRepository);
export const productService: IProductService = new ProductService(productRepository, producerRepository);
export const recommendationService: IRecommendationService = new RecommendationService(
  productRepository,
  producerRepository
);
export const telemetryService: ITelemetryService = new TelemetryService(telemetryRepository, productRepository);
export const needMatchingService: INeedMatchingService = new NeedMatchingService(
  needRepository,
  producerRepository,
  productRepository
);
export const needService: INeedService = new NeedService(needRepository, userRepository, needMatchingService);
export const analyticsService: IAnalyticsService = new AnalyticsService(
  analyticsRepository,
  producerRepository,
  productRepository,
  needRepository,
  needMatchingService
);

export const authService: IAuthService = new AuthService(userRepository, passwordHasher, tokenService);
