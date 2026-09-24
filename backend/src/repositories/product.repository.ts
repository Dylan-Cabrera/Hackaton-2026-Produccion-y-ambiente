import { Product } from '../models/index.js';
import { IProductRepository } from '../interfaces/product-repository.interface.js';
import {
  ProductPersistenceAttributes,
  ProductRecord,
  UpdateProductPersistenceAttributes
} from '../interfaces/product.types.js';

// Única clase que conoce Sequelize/el modelo. El resto del dominio solo ve IProductRepository (DIP).
export class SequelizeProductRepository implements IProductRepository {
  async create(data: ProductPersistenceAttributes): Promise<ProductRecord> {
    const instance = await Product.create(data as any);
    return this.toRecord(instance);
  }

  async findById(id: number): Promise<ProductRecord | null> {
    const instance = await Product.findByPk(id);
    return instance ? this.toRecord(instance) : null;
  }

  async update(id: number, data: UpdateProductPersistenceAttributes): Promise<ProductRecord | null> {
    const instance: any = await Product.findByPk(id);
    if (!instance) {
      return null;
    }

    await instance.update(data as any);
    return this.toRecord(instance);
  }

  async findAllByProducer(
    producerId: number,
    { onlyAvailable = false }: { onlyAvailable?: boolean } = {}
  ): Promise<ProductRecord[]> {
    const where: Record<string, unknown> = { producerId };
    if (onlyAvailable) {
      where.available = true;
    }

    const instances = await Product.findAll({ where, order: [['createdAt', 'DESC']] });
    return instances.map((instance) => this.toRecord(instance));
  }

  private toRecord(instance: any): ProductRecord {
    const plain = instance.get({ plain: true });
    return {
      id: plain.id,
      producerId: plain.producerId,
      title: plain.title,
      description: plain.description,
      category: plain.category,
      // DECIMAL llega desde Postgres como string
      price: Number(plain.price),
      offerPrice: plain.offerPrice !== null ? Number(plain.offerPrice) : null,
      isOffer: plain.isOffer,
      stockUnit: plain.stockUnit,
      imageUrl: plain.imageUrl,
      available: plain.available,
      createdAt: plain.createdAt
    };
  }
}
