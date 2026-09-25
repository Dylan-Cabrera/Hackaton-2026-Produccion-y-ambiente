import { Category } from '../constants/catalog.constants.js';
import { ClicksByLocality, TopTerm } from './analytics.types.js';

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
  ): Promise<{ whatsappClicks: number; relatedSearches: number; relatedFails: number }>;
}
