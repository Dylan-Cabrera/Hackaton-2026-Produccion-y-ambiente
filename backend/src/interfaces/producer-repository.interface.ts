import { ProducerPersistenceAttributes, ProducerRecord } from './producer.types.js';

// Abstracción de la persistencia (Dependency Inversion + Interface Segregation):
// los servicios de dominio no conocen Sequelize, solo este contrato.
export interface IProducerRepository {
  create(data: ProducerPersistenceAttributes): Promise<ProducerRecord>;
  findByEmail(email: string): Promise<ProducerRecord | null>;
  findById(id: number): Promise<ProducerRecord | null>;
  update(id: number, data: Partial<ProducerPersistenceAttributes>): Promise<ProducerRecord | null>;
  delete(id: number): Promise<boolean>;
}
