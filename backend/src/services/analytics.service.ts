import { IAnalyticsService } from '../interfaces/analytics-service.interface.js';
import { IAnalyticsRepository } from '../interfaces/analytics-repository.interface.js';
import { IProducerRepository } from '../interfaces/producer-repository.interface.js';
import { IProductRepository } from '../interfaces/product-repository.interface.js';
import {
  ProducerDemandOptions,
  ProducerDemandResponse,
  AdminAnalyticsOptions,
  AdminSummaryResponse,
  UnmetDemandMapOptions,
  UnmetDemandMapResponse
} from '../interfaces/analytics.types.js';
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
    private readonly productRepository: IProductRepository
  ) {}

  async getProducerDemand(producerId: number, options: ProducerDemandOptions): Promise<ProducerDemandResponse> {
    const producer = await this.producerRepository.findById(producerId);
    if (!producer) {
      throw new NotFoundError('Perfil de productor no encontrado');
    }

    const days = options.days ?? AnalyticsService.DEFAULT_DAYS;
    const since = new Date(Date.now() - days * MS_PER_DAY);
    const categories = await this.resolveRelatedCategories(producerId, producer.producerProfile.category);

    const [clicksByLocality, topTerms, totals] = await Promise.all([
      this.analyticsRepository.getClicksByLocality(producerId, since),
      this.analyticsRepository.getTopTerms(categories, since, AnalyticsService.TOP_TERMS_LIMIT),
      this.analyticsRepository.getTotals(producerId, categories, since)
    ]);

    return {
      days,
      totals: {
        ...totals,
        // Pendiente (HU-11): necesidades OPEN que el productor podría cubrir
        openNeedsNearby: 0
      },
      clicksByLocality,
      topTerms
    };
  }

  // Caso de uso "dashboard provincial" (HU-08): panorama agregado de toda la plataforma para el admin.
  async getAdminSummary(options: AdminAnalyticsOptions): Promise<AdminSummaryResponse> {
    const days = options.days ?? AnalyticsService.DEFAULT_DAYS;
    const since = new Date(Date.now() - days * MS_PER_DAY);

    const [accountCounts, productCounts, searchStats, producersByCategory, topCategories, topTerms] =
      await Promise.all([
        this.analyticsRepository.getAccountCounts(),
        this.analyticsRepository.getProductCounts(),
        this.analyticsRepository.getSearchStats(since),
        this.analyticsRepository.getProducersByCategory(),
        this.analyticsRepository.getTopCategoriesBySearches(since, AnalyticsService.TOP_CATEGORIES_LIMIT),
        this.analyticsRepository.getTopTermsGlobal(since, AnalyticsService.TOP_TERMS_LIMIT)
      ]);

    const searchFailRate = searchStats.searches > 0 ? Math.round((searchStats.fails / searchStats.searches) * 100) / 100 : 0;

    return {
      totals: {
        ...accountCounts,
        ...productCounts,
        searches: searchStats.searches,
        searchFailRate,
        whatsappClicks: searchStats.whatsappClicks,
        // Pendiente (HU-11): necesidades publicadas
        openNeeds: 0,
        needsWithoutMatch: 0
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

    const [supply, unmetHeat, opportunities] = await Promise.all([
      this.analyticsRepository.getSupply(options.category),
      this.analyticsRepository.getUnmetHeat(since, options.category),
      this.analyticsRepository.getOpportunities(since, options.category, AnalyticsService.OPPORTUNITIES_LIMIT)
    ]);

    return {
      supply,
      unmetHeat,
      // Pendiente (HU-11): necesidades OPEN sin matches
      unmetNeeds: [],
      opportunities
    };
  }

  // "Mi rubro o una de las categorías de mis productos" (incluye los pausados)
  private async resolveRelatedCategories(producerId: number, ownCategory: Category): Promise<Category[]> {
    const products = await this.productRepository.findAllByProducer(producerId);
    const categories = new Set<Category>([ownCategory, ...products.map((product) => product.category)]);
    return Array.from(categories);
  }
}
