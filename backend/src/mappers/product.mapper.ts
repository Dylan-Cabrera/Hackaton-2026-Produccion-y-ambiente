import { Category } from '../constants/catalog.constants.js';
import {
  CreateProductInput,
  ProductPersistenceAttributes,
  ProductRecord,
  ProductWithProducerRecord,
  PublicProduct,
  PublicProductWithProducer,
  UpdateProductInput,
  UpdateProductPersistenceAttributes
} from '../interfaces/product.types.js';

// Responsabilidad única: traducir entre las distintas formas de un producto
// (entrada de la API, fila de la base de datos, respuesta pública).
export class ProductMapper {
  // category ya viene resuelta por el servicio (explícita o heredada del rubro del productor)
  static toCreatePersistence(
    producerId: number,
    input: CreateProductInput,
    category: Category
  ): ProductPersistenceAttributes {
    const isOffer = input.isOffer ?? false;

    return {
      producerId,
      title: input.title,
      description: input.description ?? null,
      category,
      price: input.price,
      offerPrice: isOffer ? input.offerPrice ?? null : null,
      isOffer,
      stockUnit: input.stockUnit,
      imageUrl: input.imageUrl ?? null,
      available: true
    };
  }

  static toUpdatePersistence(input: UpdateProductInput): UpdateProductPersistenceAttributes {
    const data: UpdateProductPersistenceAttributes = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.category !== undefined) data.category = input.category;
    if (input.price !== undefined) data.price = input.price;
    if (input.offerPrice !== undefined) data.offerPrice = input.offerPrice;
    if (input.isOffer !== undefined) data.isOffer = input.isOffer;
    if (input.stockUnit !== undefined) data.stockUnit = input.stockUnit;
    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
    if (input.available !== undefined) data.available = input.available;

    return data;
  }

  static toPublic(record: ProductRecord): PublicProduct {
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      category: record.category,
      price: record.price,
      offerPrice: record.offerPrice,
      isOffer: record.isOffer,
      stockUnit: record.stockUnit,
      imageUrl: record.imageUrl,
      available: record.available,
      createdAt: record.createdAt
    };
  }

  static toPublicWithProducer(record: ProductWithProducerRecord): PublicProductWithProducer {
    // Usa el nombre de la clase (no `this`) porque se pasa como referencia suelta a Array.map()
    return {
      ...ProductMapper.toPublic(record),
      producer: record.producer
    };
  }
}
