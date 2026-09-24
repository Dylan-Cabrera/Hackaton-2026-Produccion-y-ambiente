import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { Product, User, ProducerProfile } from '../models/index.js';
import { IProductRepository } from '../interfaces/product-repository.interface.js';
import {
  ProductPersistenceAttributes,
  ProductRecord,
  ProductSearchCriteria,
  ProductSearchResult,
  ProductWithProducerRecord,
  UpdateProductPersistenceAttributes
} from '../interfaces/product.types.js';
import { toPlainPoint } from '../utils/geo.js';

// Única clase que conoce Sequelize/el modelo. El resto del dominio solo ve IProductRepository (DIP).
export class SequelizeProductRepository implements IProductRepository {
  // Solo se pide para incluir el productor en los resultados de búsqueda pública (HU-03)
  private static readonly PRODUCER_INCLUDE = {
    model: User,
    as: 'producer',
    attributes: ['id', 'phone', 'locality', 'coordinates'],
    required: true,
    include: [{ model: ProducerProfile, as: 'producerProfile', attributes: ['businessName'], required: true }]
  };

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

  async search(criteria: ProductSearchCriteria): Promise<ProductSearchResult> {
    const where: any[] = [{ available: true }];

    if (criteria.category) {
      where.push({ category: criteria.category });
    }
    if (criteria.isOffer !== undefined) {
      where.push({ isOffer: criteria.isOffer });
    }
    if (criteria.q) {
      // unaccent() ya está habilitada en connectDatabase() (Fase 0.8)
      where.push(
        sequelize.literal(
          "(unaccent(title) ILIKE unaccent(:q) OR unaccent(COALESCE(description, '')) ILIKE unaccent(:q))"
        )
      );
    }

    const { rows, count } = await Product.findAndCountAll({
      where: { [Op.and]: where },
      include: [SequelizeProductRepository.PRODUCER_INCLUDE],
      limit: criteria.limit,
      offset: criteria.offset,
      order: [
        ['isOffer', 'DESC'],
        ['createdAt', 'DESC']
      ],
      replacements: criteria.q ? { q: `%${criteria.q}%` } : undefined
    });

    return {
      items: rows.map((instance) => this.toRecordWithProducer(instance)),
      total: count
    };
  }

  private toRecord(instance: any): ProductRecord {
    return this.mapPlainToRecord(instance.get({ plain: true }));
  }

  private toRecordWithProducer(instance: any): ProductWithProducerRecord {
    const plain = instance.get({ plain: true });
    return {
      ...this.mapPlainToRecord(plain),
      producer: {
        id: plain.producer.id,
        businessName: plain.producer.producerProfile.businessName,
        phone: plain.producer.phone,
        locality: plain.producer.locality,
        coordinates: toPlainPoint(plain.producer.coordinates)
      }
    };
  }

  private mapPlainToRecord(plain: any): ProductRecord {
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
