import { ProducerRecord, UpdateProducerPersistenceAttributes } from './producer.types.js';

// Abstracción de la persistencia (Dependency Inversion + Interface Segregation):
// los servicios de dominio no conocen Sequelize, solo este contrato.
// El alta y la baja de la cuenta viven en IUserRepository (aplican a cualquier rol).
export interface IProducerRepository {
  findById(id: number): Promise<ProducerRecord | null>;
  update(id: number, data: UpdateProducerPersistenceAttributes): Promise<ProducerRecord | null>;
}
