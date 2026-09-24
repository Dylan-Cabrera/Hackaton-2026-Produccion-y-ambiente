import { CreateProductInput, PublicProduct, UpdateProductInput } from './product.types.js';

export interface IProductService {
  create(producerId: number, input: CreateProductInput): Promise<PublicProduct>;
  // producerId: id del productor autenticado, para verificar que el producto sea suyo
  update(id: number, producerId: number, input: UpdateProductInput): Promise<PublicProduct>;
  // Todos los productos propios, incluidos los pausados (ProducerInventoryList)
  listMine(producerId: number): Promise<PublicProduct[]>;
  // Solo productos disponibles de un productor (vista pública)
  listByProducer(producerId: number): Promise<PublicProduct[]>;
}
