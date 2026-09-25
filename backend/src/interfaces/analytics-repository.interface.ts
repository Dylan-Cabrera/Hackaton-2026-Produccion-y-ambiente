import { Category } from '../constants/catalog.constants.js';
import {
  ClicksByLocality,
  TopTerm,
  ProducersByCategory,
  TopCategory,
  SupplyPoint,
  HeatCell,
  Opportunity,
  DailyActivity,
  ProductPerformance,
  LocalityDemand
} from './analytics.types.js';

// Abstracción de las consultas agregadas sobre `demand_metrics` (Dependency Inversion):
// los servicios de dominio no conocen Sequelize ni SQL, solo este contrato.
export interface IAnalyticsRepository {
  // WHATSAPP_CLICK de este productor, agrupados por localidad, desc por conteo
  getClicksByLocality(producerId: number, since: Date): Promise<ClicksByLocality[]>;
  // SEARCH_HIT + SEARCH_FAIL en las categorías dadas, agrupados por término, top `limit`
  getTopTerms(categories: Category[], since: Date, limit: number): Promise<TopTerm[]>;
  getTotals(
    producerId: number,
    categories: Category[],
    since: Date
  ): Promise<{ productViews: number; whatsappClicks: number; relatedSearches: number; relatedFails: number }>;
  // Visitas y contactos del productor por día, un registro por cada uno de los últimos `days` días
  getDailyActivity(producerId: number, days: number): Promise<DailyActivity[]>;
  getProductPerformance(producerId: number, since: Date): Promise<ProductPerformance[]>;

  // --- Mapa de demanda: búsquedas, visitas y contactos ponderados (categories vacío/undefined = todas) ---
  getDemandHeat(since: Date, categories?: Category[]): Promise<HeatCell[]>;
  getDemandByLocality(since: Date, categories: Category[] | undefined, limit: number): Promise<LocalityDemand[]>;

  // --- HU-08: dashboard provincial (admin) ---
  getAccountCounts(): Promise<{ producers: number; consumers: number; institutions: number }>;
  getProductCounts(): Promise<{ activeProducts: number; activeOffers: number }>;
  getSearchStats(since: Date): Promise<{ searches: number; fails: number; whatsappClicks: number }>;
  getProducersByCategory(): Promise<ProducersByCategory[]>;
  getTopCategoriesBySearches(since: Date, limit: number): Promise<TopCategory[]>;
  // Igual que getTopTerms pero sin filtrar por categoría (visión provincial completa)
  getTopTermsGlobal(since: Date, limit: number): Promise<TopTerm[]>;
  getSupply(category?: Category): Promise<SupplyPoint[]>;
  getUnmetHeat(since: Date, category?: Category): Promise<HeatCell[]>;
  getOpportunities(since: Date, category: Category | undefined, limit: number): Promise<Opportunity[]>;
}
