import { IAnalyticsService } from '../interfaces/analytics-service.interface.js';
import { IAnalyticsRepository } from '../interfaces/analytics-repository.interface.js';
import { IProducerRepository } from '../interfaces/producer-repository.interface.js';
import { IProductRepository } from '../interfaces/product-repository.interface.js';
import { INeedRepository } from '../interfaces/need-repository.interface.js';
import { INeedMatchingService } from '../interfaces/need-matching-service.interface.js';
import {
  ProducerDemandOptions,
  ProducerDemandResponse,
  AdminAnalyticsOptions,
  AdminSummaryResponse,
  UnmetDemandMapOptions,
  UnmetDemandMapResponse
} from '../interfaces/analytics.types.js';
import { UnmetNeed } from '../interfaces/analytics.types.js';
import { NeedWithAuthorRecord } from '../interfaces/need.types.js';
import { Category } from '../constants/catalog.constants.js';
import { NotFoundError } from '../errors/app-error.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Caso de uso "dashboard de demanda del productor": agrega la telemetría de HU-06
// (clics de WhatsApp, búsquedas relacionadas con su rubro) de los últimos N días.
export class AnalyticsService implements IAnalyticsService {
  private static readonly DEFAULT_DAYS = 30;
  private static readonly TOP_TERMS_LIMIT = 10;
  private static readonly TOP_CATEGORIES_LIMIT = 10;
  private static readonly OPPORTUNITIES_LIMIT = 10;

  constructor(
    private readonly analyticsRepository: IAnalyticsRepository,
    private readonly producerRepository: IProducerRepository,
    private readonly productRepository: IProductRepository,
    private readonly needRepository: INeedRepository,
    private readonly needMatchingService: INeedMatchingService
  ) {}

  async getProducerDemand(producerId: number, options: ProducerDemandOptions): Promise<ProducerDemandResponse> {
    const producer = await this.producerRepository.findById(producerId);
    if (!producer) {
      throw new NotFoundError('Perfil de productor no encontrado');
    }

    const days = options.days ?? AnalyticsService.DEFAULT_DAYS;
    const since = new Date(Date.now() - days * MS_PER_DAY);
    const categories = await this.resolveRelatedCategories(producerId, producer.producerProfile.category);

    const [clicksByLocality, topTerms, totals, openNeedsForProducer] = await Promise.all([
      this.analyticsRepository.getClicksByLocality(producerId, since),
      this.analyticsRepository.getTopTerms(categories, since, AnalyticsService.TOP_TERMS_LIMIT),
      this.analyticsRepository.getTotals(producerId, categories, since),
      this.needMatchingService.getForProducer(producerId)
    ]);

    return {
      days,
      totals: {
        ...totals,
        // Necesidades OPEN que el productor podría cubrir (misma lógica que GET /api/needs/for-me)
        openNeedsNearby: openNeedsForProducer.length
      },
      clicksByLocality,
      topTerms
    };
  }

  // Caso de uso "dashboard provincial" (HU-08): panorama agregado de toda la plataforma para el admin.
  async getAdminSummary(options: AdminAnalyticsOptions): Promise<AdminSummaryResponse> {
    const days = options.days ?? AnalyticsService.DEFAULT_DAYS;
    const since = new Date(Date.now() - days * MS_PER_DAY);

    const [accountCounts, productCounts, searchStats, producersByCategory, topCategories, topTerms, openNeeds, unmatchedOpenNeeds] =
      await Promise.all([
        this.analyticsRepository.getAccountCounts(),
        this.analyticsRepository.getProductCounts(),
        this.analyticsRepository.getSearchStats(since),
        this.analyticsRepository.getProducersByCategory(),
        this.analyticsRepository.getTopCategoriesBySearches(since, AnalyticsService.TOP_CATEGORIES_LIMIT),
        this.analyticsRepository.getTopTermsGlobal(since, AnalyticsService.TOP_TERMS_LIMIT),
        this.needRepository.countOpen(),
        this.findOpenNeedsWithoutMatch()
      ]);

    const searchFailRate = searchStats.searches > 0 ? Math.round((searchStats.fails / searchStats.searches) * 100) / 100 : 0;

    return {
      totals: {
        ...accountCounts,
        ...productCounts,
        searches: searchStats.searches,
        searchFailRate,
        whatsappClicks: searchStats.whatsappClicks,
        openNeeds,
        needsWithoutMatch: unmatchedOpenNeeds.length
      },
      producersByCategory,
      topCategories,
      topTerms
    };
  }

  // Caso de uso "mapa de vacíos" (HU-08): oferta existente vs. demanda insatisfecha (búsquedas fallidas).
  async getUnmetDemandMap(options: UnmetDemandMapOptions): Promise<UnmetDemandMapResponse> {
    const days = options.days ?? AnalyticsService.DEFAULT_DAYS;
    const since = new Date(Date.now() - days * MS_PER_DAY);

    const [supply, unmetHeat, opportunities, unmatchedOpenNeeds] = await Promise.all([
      this.analyticsRepository.getSupply(options.category),
      this.analyticsRepository.getUnmetHeat(since, options.category),
      this.analyticsRepository.getOpportunities(since, options.category, AnalyticsService.OPPORTUNITIES_LIMIT),
      this.findOpenNeedsWithoutMatch()
    ]);

    const unmetNeeds = unmatchedOpenNeeds
      .filter((need) => !options.category || need.category === options.category)
      .map((need) => this.toUnmetNeed(need));

    return {
      supply,
      unmetHeat,
      unmetNeeds,
      opportunities
    };
  }

  // Necesidades OPEN con 0 matches: demanda insatisfecha explícita (más fuerte que una
  // búsqueda fallida). La usan tanto el resumen provincial como el mapa de vacíos (HU-08).
  private async findOpenNeedsWithoutMatch(): Promise<NeedWithAuthorRecord[]> {
    const openNeeds = await this.needRepository.findAllOpenWithAuthor();

    const withMatchCount = await Promise.all(
      openNeeds.map(async (need) => ({
        need,
        total: (await this.needMatchingService.getTopMatchesWithCount(need, 0)).total
      }))
    );

    return withMatchCount.filter((entry) => entry.total === 0).map((entry) => entry.need);
  }

  private toUnmetNeed(need: NeedWithAuthorRecord): UnmetNeed {
    const [lng, lat] = need.coordinates.coordinates;

    return {
      id: need.id,
      title: need.title,
      category: need.category,
      quantity: need.quantity,
      unit: need.unit,
      frequency: need.frequency,
      locality: need.locality,
      lat,
      lng,
      authorType: need.author.institutionType ?? need.author.accountType ?? 'Productor'
    };
  }

  // "Mi rubro o una de las categorías de mis productos" (incluye los pausados)
  private async resolveRelatedCategories(producerId: number, ownCategory: Category): Promise<Category[]> {
    const products = await this.productRepository.findAllByProducer(producerId);
    const categories = new Set<Category>([ownCategory, ...products.map((product) => product.category)]);
    return Array.from(categories);
  }
}
