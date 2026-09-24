import { AuthResult, LoginInput, PublicUserProfile, RegisterInput, UpdateUserInput } from './user.types.js';

export interface IAuthService {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
  getProfile(userId: number): Promise<PublicUserProfile>;
  updateProfile(userId: number, input: UpdateUserInput): Promise<PublicUserProfile>;
  deleteAccount(userId: number): Promise<void>;
}
