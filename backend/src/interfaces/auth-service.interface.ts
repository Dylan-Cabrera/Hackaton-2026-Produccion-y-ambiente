import { AuthResult, LoginInput, PublicProducerProfile } from './producer.types.js';

export interface IAuthService {
  login(input: LoginInput): Promise<AuthResult>;
  getProfile(producerId: number): Promise<PublicProducerProfile>;
}
