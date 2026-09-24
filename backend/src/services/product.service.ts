import { IProductService } from '../interfaces/product-service.interface.js';
import { IProductRepository } from '../interfaces/product-repository.interface.js';
import { IProducerRepository } from '../interfaces/producer-repository.interface.js';
import {
  CreateProductInput,
  ProductSearchResponse,
  PublicProduct,
  SearchProductsInput,
  UpdateProductInput
} from '../interfaces/product.types.js';
import { Category } from '../constants/catalog.constants.js';
import { ProductMapper } from '../mappers/product.mapper.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../errors/app-error.js';

// Caso de uso "productos de un productor": alta, edición, listados y búsqueda pública.
// Depende únicamente de abstracciones (DIP), lo que permite testearlo con dobles sin tocar Sequelize.
export class ProductService implements IProductService {
  private static readonly DEFAULT_SEARCH_LIMIT = 24;

  constructor(
    private readonly productRepository: IProductRepository,
    private readonly producerRepository: IProducerRepository
  ) {}

  async create(producerId: number, input: CreateProductInput): Promise<PublicProduct> {
    const isOffer = input.isOffer ?? false;
    this.assertValidOffer(isOffer, input.price, isOffer ? input.offerPrice ?? null : null);

    const category = input.category ?? (await this.resolveProducerCategory(producerId));

    const record = await this.productRepository.create(
      ProductMapper.toCreatePersistence(producerId, input, category)
    );
    return ProductMapper.toPublic(record);
  }

  async update(id: number, producerId: number, input: UpdateProductInput): Promise<PublicProduct> {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Producto no encontrado');
    }
    if (existing.producerId !== producerId) {
      throw new ForbiddenError('No tiene permisos para editar este producto');
    }

    // La regla de oferta se valida contra el resultado final (input + valores ya guardados)
    const nextIsOffer = input.isOffer ?? existing.isOffer;
    const nextPrice = input.price ?? existing.price;
    const nextOfferPrice = input.offerPrice !== undefined ? input.offerPrice : existing.offerPrice;
    this.assertValidOffer(nextIsOffer, nextPrice, nextIsOffer ? nextOfferPrice : null);

    const patch = ProductMapper.toUpdatePersistence(input);
    if (!nextIsOffer) {
      patch.isOffer = false;
      patch.offerPrice = null;
    }

    const updated = await this.productRepository.update(id, patch);
    if (!updated) {
      throw new NotFoundError('Producto no encontrado');
    }
    return ProductMapper.toPublic(updated);
  }

  async listMine(producerId: number): Promise<PublicProduct[]> {
    const records = await this.productRepository.findAllByProducer(producerId, { onlyAvailable: false });
    return records.map(ProductMapper.toPublic);
  }

  async listByProducer(producerId: number): Promise<PublicProduct[]> {
    const records = await this.productRepository.findAllByProducer(producerId, { onlyAvailable: true });
    return records.map(ProductMapper.toPublic);
  }

  async search(input: SearchProductsInput): Promise<ProductSearchResponse> {
    const limit = input.limit ?? ProductService.DEFAULT_SEARCH_LIMIT;
    const offset = input.offset ?? 0;

    const { items, total } = await this.productRepository.search({
      q: input.q?.trim() || undefined,
      category: input.category,
      isOffer: input.isOffer,
      limit,
      offset
    });

    return {
      items: items.map(ProductMapper.toPublicWithProducer),
      limit,
      offset,
      total
    };
  }

  private async resolveProducerCategory(producerId: number): Promise<Category> {
    const producer = await this.producerRepository.findById(producerId);
    if (!producer) {
      throw new NotFoundError('Perfil de productor no encontrado');
    }
    return producer.producerProfile.category;
  }

  private assertValidOffer(isOffer: boolean, price: number, offerPrice: number | null): void {
    if (!isOffer) {
      return;
    }
    if (offerPrice === null) {
      throw new ValidationError('El precio de oferta es obligatorio cuando isOffer es true');
    }
    if (offerPrice >= price) {
      throw new ValidationError('El precio de oferta debe ser menor al precio regular');
    }
  }
}
