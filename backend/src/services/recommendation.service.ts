import { IRecommendationService } from '../interfaces/recommendation-service.interface.js';
import { IProductRepository } from '../interfaces/product-repository.interface.js';
import { IProducerRepository } from '../interfaces/producer-repository.interface.js';
import { ProductWithProducerRecord } from '../interfaces/product.types.js';
import { B2BRecommendationOptions, B2BRecommendationResponse } from '../interfaces/recommendation.types.js';
import { SUPPLY_MATRIX } from '../constants/supply-matrix.constants.js';
import { NotFoundError } from '../errors/app-error.js';

// Caso de uso "recomendación B2B de insumos": a partir del rubro del productor autenticado,
// busca ofertas de los insumos que ese rubro suele necesitar, cerca suyo. Depende únicamente
// de abstracciones (DIP), lo que permite testearlo con dobles sin tocar Sequelize.
export class RecommendationService implements IRecommendationService {
  private static readonly DEFAULT_RADIUS_KM = 50;
  private static readonly MAX_RADIUS_KM = 300;
  private static readonly DEFAULT_LIMIT = 10;
  // Techo del pool de candidatos que trae la búsqueda antes de aplicar el ranking en memoria.
  // El orden final (oferta > cercanía > precio) no es el mismo que devuelve la DB, así que no
  // se puede paginar en SQL: alcanza con el volumen de la demo (decenas de productos).
  private static readonly CANDIDATE_POOL_LIMIT = 500;

  constructor(
    private readonly productRepository: IProductRepository,
    private readonly producerRepository: IProducerRepository
  ) {}

  async getB2BRecommendations(
    producerId: number,
    options: B2BRecommendationOptions
  ): Promise<B2BRecommendationResponse> {
    const producer = await this.producerRepository.findById(producerId);
    if (!producer) {
      throw new NotFoundError('Perfil de productor no encontrado');
    }

    const producerCategory = producer.producerProfile.category;
    const radiusKm = Math.min(options.radiusKm ?? RecommendationService.DEFAULT_RADIUS_KM, RecommendationService.MAX_RADIUS_KM);
    const limit = options.limit ?? RecommendationService.DEFAULT_LIMIT;
    const inputs = SUPPLY_MATRIX[producerCategory] ?? [];

    if (inputs.length === 0) {
      return { producerCategory, inputs: [], radiusKm, recommendations: [] };
    }

    // Un PRODUCER siempre tiene coordenadas (obligatorias o inferidas del centroide de su
    // localidad al registrarse, ver UserMapper.toPersistence)
    const [lng, lat] = producer.coordinates!.coordinates;

    const { items } = await this.productRepository.search({
      categories: inputs,
      excludeProducerId: producerId,
      lat,
      lng,
      maxDistance: radiusKm,
      limit: RecommendationService.CANDIDATE_POOL_LIMIT,
      offset: 0
    });

    const recommendations = items
      .slice()
      .sort((a, b) => this.compareByOfferDistancePrice(a, b))
      .slice(0, limit)
      .map((item) => ({
        matchedInput: item.category,
        distanceKm: item.distanceKm ?? 0,
        product: {
          id: item.id,
          title: item.title,
          price: item.price,
          offerPrice: item.offerPrice,
          isOffer: item.isOffer,
          stockUnit: item.stockUnit,
          imageUrl: item.imageUrl
        },
        producer: {
          id: item.producer.id,
          businessName: item.producer.businessName,
          phone: item.producer.phone,
          locality: item.producer.locality
        }
      }));

    return { producerCategory, inputs, radiusKm, recommendations };
  }

  // isOffer DESC, distanceKm ASC, COALESCE(offerPrice, price) ASC
  private compareByOfferDistancePrice(a: ProductWithProducerRecord, b: ProductWithProducerRecord): number {
    if (a.isOffer !== b.isOffer) {
      return a.isOffer ? -1 : 1;
    }

    const distanceDiff = (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
    if (distanceDiff !== 0) {
      return distanceDiff;
    }

    const priceA = a.offerPrice ?? a.price;
    const priceB = b.offerPrice ?? b.price;
    return priceA - priceB;
  }
}
