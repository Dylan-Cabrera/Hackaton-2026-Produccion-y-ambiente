import {
  ProductPersistenceAttributes,
  ProductRecord,
  ProductSearchCriteria,
  ProductSearchResult,
  ProductWithProducerRecord,
  UpdateProductPersistenceAttributes
} from './product.types.js';

// Abstracción de la persistencia (Dependency Inversion + Interface Segregation):
// los servicios de dominio no conocen Sequelize, solo este contrato.
export interface IProductRepository {
  create(data: ProductPersistenceAttributes): Promise<ProductRecord>;
  findById(id: number): Promise<ProductRecord | null>;
  update(id: number, data: UpdateProductPersistenceAttributes): Promise<ProductRecord | null>;
  findAllByProducer(producerId: number, options?: { onlyAvailable?: boolean }): Promise<ProductRecord[]>;
  // Búsqueda pública (HU-03): siempre available=true, incluye datos del productor
  search(criteria: ProductSearchCriteria): Promise<ProductSearchResult>;

  // Arranque en frío de HU-10: productos disponibles con más WHATSAPP_CLICK desde `since`,
  // priorizando cercanía cuando hay lat/lng
  findPopular(params: {
    since: Date;
    lat?: number;
    lng?: number;
    excludeProducerId?: number;
    limit: number;
  }): Promise<ProductWithProducerRecord[]>;
}
