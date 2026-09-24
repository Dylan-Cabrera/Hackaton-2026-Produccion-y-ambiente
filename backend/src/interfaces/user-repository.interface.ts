import { CreateUserPersistenceAttributes, UpdateUserPersistenceAttributes, UserRecord } from './user.types.js';

// Abstracción de la persistencia de cuentas (cualquier rol). Los servicios de dominio
// no conocen Sequelize, solo este contrato.
export interface IUserRepository {
  create(data: CreateUserPersistenceAttributes): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: number): Promise<UserRecord | null>;
  update(id: number, data: UpdateUserPersistenceAttributes): Promise<UserRecord | null>;
  delete(id: number): Promise<boolean>;
}
