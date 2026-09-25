import { INeedMatchingService } from '../interfaces/need-matching-service.interface.js';
import { INeedRepository } from '../interfaces/need-repository.interface.js';
import { IProducerRepository } from '../interfaces/producer-repository.interface.js';
import { IProductRepository } from '../interfaces/product-repository.interface.js';
import { RequesterContext } from '../interfaces/need-service.interface.js';
import {
  ForProducerNeed,
  GetMatchesOptions,
  MatchingProduct,
  NeedMatch,
  NeedMatchCandidate,
  NeedMatchesResponse,
  NeedRecord
} from '../interfaces/need.types.js';
import { extractKeywords, normalizeTerm } from '../utils/text.js';
import { ForbiddenError, NotFoundError } from '../errors/app-error.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Algoritmo de matching de HU-11: dado una necesidad, recomienda productores cercanos
// que puedan cubrirla, con un puntaje explicable (`reasons`). Separado de NeedService (CRUD)
// por responsabilidad única.
export class NeedMatchingService implements INeedMatchingService {
  private static readonly DEFAULT_LIMIT = 10;
  private static readonly ACTIVITY_WINDOW_DAYS = 30;

  private static readonly WEIGHTS = {
    text: 0.4,
    category: 0.2,
    proximity: 0.25,
    unit: 0.1,
    activity: 0.05
  };

  constructor(
    private readonly needRepository: INeedRepository,
    private readonly producerRepository: IProducerRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async getMatchesFor(needId: number, requester: RequesterContext, options: GetMatchesOptions): Promise<NeedMatchesResponse> {
    const need = await this.needRepository.findById(needId);
    if (!need) {
      throw new NotFoundError('Necesidad no encontrada');
    }
    if (need.userId !== requester.userId && requester.role !== 'ADMIN') {
      throw new ForbiddenError('No tiene permisos para ver los matches de esta necesidad');
    }

    const limit = options.limit ?? NeedMatchingService.DEFAULT_LIMIT;
    const matches = await this.computeMatches(need, options.radiusKm ?? need.radiusKm);

    return {
      need: {
        id: need.id,
        title: need.title,
        quantity: need.quantity,
        unit: need.unit,
        frequency: need.frequency,
        radiusKm: need.radiusKm
      },
      matches: matches.slice(0, limit)
    };
  }

  async getTopMatchesWithCount(need: NeedRecord, limit: number): Promise<{ matches: NeedMatch[]; total: number }> {
    const matches = await this.computeMatches(need, need.radiusKm);
    return { matches: matches.slice(0, limit), total: matches.length };
  }

  async getForProducer(producerId: number): Promise<ForProducerNeed[]> {
    const producer = await this.producerRepository.findById(producerId);
    if (!producer) {
      throw new NotFoundError('Perfil de productor no encontrado');
    }
    if (!producer.coordinates) {
      return [];
    }

    const products = await this.productRepository.findAllByProducer(producerId, { onlyAvailable: true });
    const categories = Array.from(new Set([producer.producerProfile.category, ...products.map((p) => p.category)]));
    const keywords = Array.from(new Set(products.flatMap((p) => extractKeywords(p.title))));

    const [lng, lat] = producer.coordinates.coordinates;
    const candidates = await this.needRepository.findForProducer({
      producerId,
      categories,
      keywordsByCategory: keywords,
      lat,
      lng
    });

    return candidates.map((candidate) => {
      const needKeywords = extractKeywords(`${candidate.title} ${candidate.description ?? ''}`);
      const matchedProducts = products
        .filter(
          (product) =>
            product.category === candidate.category ||
            needKeywords.some((keyword) => normalizeTerm(product.title).includes(keyword))
        )
        .map((product) => this.toMatchingProduct(product));

      return {
        id: candidate.id,
        title: candidate.title,
        description: candidate.description,
        category: candidate.category,
        quantity: candidate.quantity,
        unit: candidate.unit,
        frequency: candidate.frequency,
        locality: candidate.locality,
        radiusKm: candidate.radiusKm,
        createdAt: candidate.createdAt,
        distanceKm: candidate.distanceKm,
        author: {
          id: candidate.author.id,
          displayName: candidate.author.organizationName ?? candidate.author.name,
          accountType: candidate.author.accountType,
          institutionType: candidate.author.institutionType,
          locality: candidate.author.locality,
          // El productor siempre ve el teléfono del autor (regla de privacidad de HU-11)
          phone: candidate.author.phone
        },
        matchedProducts
      };
    });
  }

  private async computeMatches(need: NeedRecord, radiusKm: number): Promise<NeedMatch[]> {
    const keywords = extractKeywords(`${need.title} ${need.description ?? ''}`);
    const [lng, lat] = need.coordinates.coordinates;
    const since = new Date(Date.now() - NeedMatchingService.ACTIVITY_WINDOW_DAYS * MS_PER_DAY);

    const candidates = await this.needRepository.findMatchCandidates({
      category: need.category,
      keywords,
      lat,
      lng,
      radiusKm,
      since
    });

    const maxClicks = Math.max(0, ...candidates.map((candidate) => candidate.whatsappClicks));

    return candidates
      .map((candidate) => this.scoreCandidate(candidate, need, keywords, radiusKm, maxClicks))
      .sort((a, b) => b.score - a.score);
  }

  private scoreCandidate(
    candidate: NeedMatchCandidate,
    need: NeedRecord,
    keywords: string[],
    radiusKm: number,
    maxClicks: number
  ): NeedMatch {
    const textMatch = candidate.matchingProducts.some((product) =>
      keywords.some((keyword) => normalizeTerm(product.title).includes(keyword))
    );
    const categoryMatch =
      candidate.category === need.category || candidate.matchingProducts.some((product) => product.category === need.category);
    const unitMatch = candidate.matchingProducts.some((product) => product.stockUnit === need.unit);
    const proximityScore = 1 - Math.min(candidate.distanceKm, radiusKm) / radiusKm;
    const activityScore = maxClicks > 0 ? candidate.whatsappClicks / maxClicks : 0;

    const score =
      (textMatch ? NeedMatchingService.WEIGHTS.text : 0) +
      (categoryMatch ? NeedMatchingService.WEIGHTS.category : 0) +
      proximityScore * NeedMatchingService.WEIGHTS.proximity +
      (unitMatch ? NeedMatchingService.WEIGHTS.unit : 0) +
      activityScore * NeedMatchingService.WEIGHTS.activity;

    return {
      score: Math.round(score * 100) / 100,
      distanceKm: candidate.distanceKm,
      reasons: this.buildReasons(candidate, keywords, unitMatch, need),
      producer: {
        id: candidate.producerId,
        name: candidate.name,
        businessName: candidate.businessName,
        category: candidate.category,
        phone: candidate.phone,
        locality: candidate.locality,
        address: candidate.address,
        paymentMethods: candidate.paymentMethods,
        deliveryOptions: candidate.deliveryOptions,
        bio: candidate.bio
      },
      matchingProducts: candidate.matchingProducts
    };
  }

  private buildReasons(candidate: NeedMatchCandidate, keywords: string[], unitMatch: boolean, need: NeedRecord): string[] {
    const reasons: string[] = [];

    const textMatchProduct = candidate.matchingProducts.find((product) =>
      keywords.some((keyword) => normalizeTerm(product.title).includes(keyword))
    );
    if (textMatchProduct) {
      reasons.push(`Vende ${textMatchProduct.title}`);
    }

    reasons.push(`A ${candidate.distanceKm} km`);

    if (unitMatch) {
      reasons.push(`Vende por ${need.unit}`);
    }

    if (candidate.matchingProducts.some((product) => product.isOffer)) {
      reasons.push('Tiene oferta vigente');
    }

    return reasons;
  }

  private toMatchingProduct(product: { id: number; title: string; price: number; offerPrice: number | null; isOffer: boolean; stockUnit: string; imageUrl: string | null; category: string }): MatchingProduct {
    return {
      id: product.id,
      title: product.title,
      price: product.price,
      offerPrice: product.offerPrice,
      isOffer: product.isOffer,
      stockUnit: product.stockUnit as MatchingProduct['stockUnit'],
      imageUrl: product.imageUrl,
      category: product.category as MatchingProduct['category']
    };
  }
}
