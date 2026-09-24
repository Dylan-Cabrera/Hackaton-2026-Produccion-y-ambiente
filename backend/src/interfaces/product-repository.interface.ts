import {
  ProductPersistenceAttributes,
  ProductRecord,
  UpdateProductPersistenceAttributes
} from './product.types.js';

// Abstracción de la persistencia (Dependency Inversion + Interface Segregation):
// los servicios de dominio no conocen Sequelize, solo este contrato.
export interface IProductRepository {
  create(data: ProductPersistenceAttributes): Promise<ProductRecord>;
  findById(id: number): Promise<ProductRecord | null>;
  update(id: number, data: UpdateProductPersistenceAttributes): Promise<ProductRecord | null>;
  findAllByProducer(producerId: number, options?: { onlyAvailable?: boolean }): Promise<ProductRecord[]>;
}
