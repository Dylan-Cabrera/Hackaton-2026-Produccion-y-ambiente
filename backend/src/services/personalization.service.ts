import { IPersonalizationService } from '../interfaces/personalization-service.interface.js';
import { ITelemetryRepository } from '../interfaces/telemetry-repository.interface.js';
import { IProductRepository } from '../interfaces/product-repository.interface.js';
import { IUserRepository } from '../interfaces/user-repository.interface.js';
import {
  CategoryAffinity,
  ForYouItem,
  ForYouOptions,
  ForYouProduct,
  ForYouResponse,
  RecentTerm,
  RecommendationReason
} from '../interfaces/personalization.types.js';
import { UserTelemetryEvent } from '../interfaces/telemetry.types.js';
import { ProductWithProducerRecord } from '../interfaces/product.types.js';
import { Category } from '../constants/catalog.constants.js';
import { normalizeTerm } from '../utils/text.js';
import { NotFoundError } from '../errors/app-error.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Caso de uso "recomendaciones para vos" (HU-10): arma un feed personalizado a partir de la
// telemetría propia del usuario (HU-06), con arranque en frío cuando todavía no tiene historial.
export class PersonalizationService implements IPersonalizationService {
  private static readonly HISTORY_WINDOW_DAYS = 60;
  private static readonly COLD_START_WINDOW_DAYS = 30;
  private static readonly AFFINITY_HALF_LIFE_DAYS = 14;
  private static readonly DEFAULT_LIMIT = 12;
  private static readonly TOP_CATEGORIES = 3;
  private static readonly RECENT_TERMS = 5;
  private static readonly CANDIDATE_POOL_LIMIT = 200;
  private static readonly TERM_SEARCH_LIMIT = 50;
  private static readonly MAX_PER_PRODUCER = 3;
  private static readonly PROXIMITY_CAP_KM = 50;

  private static readonly EVENT_WEIGHTS: Partial<Record<UserTelemetryEvent['eventType'], number>> = {
    WHATSAPP_CLICK: 3,
    SEARCH_FAIL: 1.5,
    SEARCH_HIT: 1
  };

  private static readonly WEIGHTS = {
    category: 0.45,
    text: 0.3,
    proximity: 0.15,
    offer: 0.1
  };

  constructor(
    private readonly telemetryRepository: ITelemetryRepository,
    private readonly productRepository: IProductRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async getForYou(userId: number, options: ForYouOptions): Promise<ForYouResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const limit = options.limit ?? PersonalizationService.DEFAULT_LIMIT;
    const lat = options.lat ?? user.coordinates?.coordinates[1];
    const lng = options.lng ?? user.coordinates?.coordinates[0];
    const excludeProducerId = user.role === 'PRODUCER' ? userId : undefined;

    const since = new Date(Date.now() - PersonalizationService.HISTORY_WINDOW_DAYS * MS_PER_DAY);
    const events = await this.telemetryRepository.findByUser(userId, since);

    if (events.length === 0) {
      return this.buildColdStart(excludeProducerId, lat, lng, limit);
    }

    const categoryAffinity = this.computeCategoryAffinity(events);
    const recentTerms = this.computeRecentTerms(events);
    const topCategories = Array.from(categoryAffinity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, PersonalizationService.TOP_CATEGORIES)
      .map(([category]) => category);

    const candidates = await this.collectCandidates(
      topCategories,
      recentTerms.map((t) => t.term),
      lat,
      lng,
      excludeProducerId
    );

    const scored = candidates
      .map((candidate) => this.scoreCandidate(candidate, categoryAffinity, recentTerms))
      .sort((a, b) => b.score - a.score);

    return { coldStart: false, items: this.applyDiversity(scored, limit) };
  }

  // Sin historial: lo más clickeado por WhatsApp cerca suyo en los últimos 30 días,
  // completado con ofertas cercanas si no alcanza el límite pedido
  private async buildColdStart(
    excludeProducerId: number | undefined,
    lat: number | undefined,
    lng: number | undefined,
    limit: number
  ): Promise<ForYouResponse> {
    const since = new Date(Date.now() - PersonalizationService.COLD_START_WINDOW_DAYS * MS_PER_DAY);
    const popular = await this.productRepository.findPopular({ since, lat, lng, excludeProducerId, limit });

    const reason: RecommendationReason = { type: 'POPULAR_NEAR', label: 'Popular cerca tuyo' };
    const items: ForYouItem[] = popular.map((product) => ({
      score: 1,
      reason,
      product: this.toForYouProduct(product)
    }));

    if (items.length < limit && lat !== undefined && lng !== undefined) {
      const { items: offers } = await this.productRepository.search({
        isOffer: true,
        lat,
        lng,
        maxDistance: PersonalizationService.PROXIMITY_CAP_KM,
        limit: limit - items.length,
        offset: 0,
        excludeProducerId
      });

      const existingIds = new Set(items.map((item) => item.product.id));
      for (const offer of offers) {
        if (!existingIds.has(offer.id)) {
          items.push({ score: 0.5, reason, product: this.toForYouProduct(offer) });
        }
      }
    }

    return { coldStart: true, items: items.slice(0, limit) };
  }

  // Cada evento suma a la categoría un peso con decaimiento temporal (vida media de 14 días);
  // al final se normaliza para que la categoría con más afinidad valga 1
  private computeCategoryAffinity(events: UserTelemetryEvent[]): CategoryAffinity {
    const raw = new Map<Category, number>();
    const now = Date.now();

    for (const event of events) {
      if (!event.category) continue;
      const weight = PersonalizationService.EVENT_WEIGHTS[event.eventType] ?? 0;
      if (weight === 0) continue;

      const daysElapsed = (now - event.timestamp.getTime()) / MS_PER_DAY;
      const decay = Math.pow(0.5, daysElapsed / PersonalizationService.AFFINITY_HALF_LIFE_DAYS);
      raw.set(event.category, (raw.get(event.category) ?? 0) + weight * decay);
    }

    const max = Math.max(0, ...raw.values());
    if (max === 0) {
      return raw;
    }

    const normalized = new Map<Category, number>();
    for (const [category, value] of raw) {
      normalized.set(category, value / max);
    }
    return normalized;
  }

  // Últimos 5 términos de búsqueda distintos, recordando si su aparición más reciente falló
  private computeRecentTerms(events: UserTelemetryEvent[]): RecentTerm[] {
    const searches = events
      .filter((event) => event.queryTerm && (event.eventType === 'SEARCH_HIT' || event.eventType === 'SEARCH_FAIL'))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const seenFailed = new Map<string, boolean>();
    const order: string[] = [];

    for (const event of searches) {
      const term = event.queryTerm!.toLowerCase();
      if (!seenFailed.has(term)) {
        seenFailed.set(term, event.eventType === 'SEARCH_FAIL');
        order.push(term);
        if (order.length >= PersonalizationService.RECENT_TERMS) break;
      }
    }

    return order.map((term) => ({ term, failed: seenFailed.get(term)! }));
  }

  // Productos disponibles en las categorías con más afinidad, o cuyo título coincide con
  // algún término reciente (máx. 200 candidatos, deduplicados por id)
  private async collectCandidates(
    categories: Category[],
    terms: string[],
    lat: number | undefined,
    lng: number | undefined,
    excludeProducerId: number | undefined
  ): Promise<ProductWithProducerRecord[]> {
    const byId = new Map<number, ProductWithProducerRecord>();

    if (categories.length > 0) {
      const { items } = await this.productRepository.search({
        categories,
        lat,
        lng,
        limit: PersonalizationService.CANDIDATE_POOL_LIMIT,
        offset: 0,
        excludeProducerId
      });
      for (const item of items) byId.set(item.id, item);
    }

    for (const term of terms) {
      const { items } = await this.productRepository.search({
        q: term,
        lat,
        lng,
        limit: PersonalizationService.TERM_SEARCH_LIMIT,
        offset: 0,
        excludeProducerId
      });
      for (const item of items) byId.set(item.id, item);
    }

    return Array.from(byId.values());
  }

  private scoreCandidate(
    candidate: ProductWithProducerRecord,
    categoryAffinity: CategoryAffinity,
    recentTerms: RecentTerm[]
  ): ForYouItem {
    const affinity = categoryAffinity.get(candidate.category) ?? 0;
    const normalizedTitle = normalizeTerm(candidate.title);
    const matchedTerm = recentTerms.find((recent) => normalizedTitle.includes(normalizeTerm(recent.term)));
    const textMatch = matchedTerm ? 1 : 0;
    const proximity =
      candidate.distanceKm !== undefined
        ? 1 - Math.min(candidate.distanceKm, PersonalizationService.PROXIMITY_CAP_KM) / PersonalizationService.PROXIMITY_CAP_KM
        : 0;
    const offerScore = candidate.isOffer ? 1 : 0;

    const score =
      affinity * PersonalizationService.WEIGHTS.category +
      textMatch * PersonalizationService.WEIGHTS.text +
      proximity * PersonalizationService.WEIGHTS.proximity +
      offerScore * PersonalizationService.WEIGHTS.offer;

    return {
      score: Math.round(score * 100) / 100,
      reason: this.buildReason(matchedTerm, affinity, candidate.category),
      product: this.toForYouProduct(candidate)
    };
  }

  // Prioridad: NOW_AVAILABLE (buscó algo que falló y ahora existe) > SEARCHED > CATEGORY > POPULAR_NEAR
  private buildReason(matchedTerm: RecentTerm | undefined, affinity: number, category: Category): RecommendationReason {
    if (matchedTerm?.failed) {
      return { type: 'NOW_AVAILABLE', label: `Lo buscaste y ahora hay: ${matchedTerm.term}` };
    }
    if (matchedTerm) {
      return { type: 'SEARCHED', label: `Porque buscaste '${matchedTerm.term}'` };
    }
    if (affinity > 0) {
      return { type: 'CATEGORY', label: `Porque te interesa ${category}` };
    }
    return { type: 'POPULAR_NEAR', label: 'Popular cerca tuyo' };
  }

  // Máximo 3 productos por productor, respetando el orden por score ya calculado
  private applyDiversity(items: ForYouItem[], limit: number): ForYouItem[] {
    const perProducer = new Map<number, number>();
    const result: ForYouItem[] = [];

    for (const item of items) {
      const count = perProducer.get(item.product.producer.id) ?? 0;
      if (count >= PersonalizationService.MAX_PER_PRODUCER) continue;

      perProducer.set(item.product.producer.id, count + 1);
      result.push(item);
      if (result.length >= limit) break;
    }

    return result;
  }

  private toForYouProduct(record: ProductWithProducerRecord): ForYouProduct {
    return {
      id: record.id,
      title: record.title,
      price: record.price,
      offerPrice: record.offerPrice,
      isOffer: record.isOffer,
      stockUnit: record.stockUnit,
      imageUrl: record.imageUrl,
      distanceKm: record.distanceKm ?? null,
      producer: {
        id: record.producer.id,
        businessName: record.producer.businessName,
        phone: record.producer.phone,
        locality: record.producer.locality
      }
    };
  }
}
