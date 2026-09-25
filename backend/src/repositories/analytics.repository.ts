import { QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Category } from '../constants/catalog.constants.js';
import { IAnalyticsRepository } from '../interfaces/analytics-repository.interface.js';
import { ClicksByLocality, TopTerm } from '../interfaces/analytics.types.js';

// Única clase que conoce Sequelize/SQL crudo para las consultas agregadas de analítica.
// El resto del dominio solo ve IAnalyticsRepository (DIP). Todo valor del usuario que entra
// en SQL va con `replacements`, nunca interpolado en el string (regla de seguridad del plan).
export class SequelizeAnalyticsRepository implements IAnalyticsRepository {
  async getClicksByLocality(producerId: number, since: Date): Promise<ClicksByLocality[]> {
    return sequelize.query<ClicksByLocality>(
      `SELECT locality, COUNT(*)::int AS clicks
       FROM demand_metrics
       WHERE "eventType" = 'WHATSAPP_CLICK'
         AND "producerId" = :producerId
         AND "timestamp" >= :since
         AND locality IS NOT NULL
       GROUP BY locality
       ORDER BY clicks DESC`,
      { type: QueryTypes.SELECT, replacements: { producerId, since } }
    );
  }

  async getTopTerms(categories: Category[], since: Date, limit: number): Promise<TopTerm[]> {
    return sequelize.query<TopTerm>(
      `SELECT "queryTerm" AS term,
              COUNT(*)::int AS count,
              COUNT(*) FILTER (WHERE "eventType" = 'SEARCH_FAIL')::int AS fails
       FROM demand_metrics
       WHERE "eventType" IN ('SEARCH_HIT', 'SEARCH_FAIL')
         AND category IN (:categories)
         AND "timestamp" >= :since
         AND "queryTerm" IS NOT NULL
       GROUP BY "queryTerm"
       ORDER BY count DESC
       LIMIT :limit`,
      { type: QueryTypes.SELECT, replacements: { categories, since, limit } }
    );
  }

  async getTotals(
    producerId: number,
    categories: Category[],
    since: Date
  ): Promise<{ whatsappClicks: number; relatedSearches: number; relatedFails: number }> {
    const [row] = await sequelize.query<{ whatsappClicks: number; relatedSearches: number; relatedFails: number }>(
      `SELECT
         (SELECT COUNT(*)::int FROM demand_metrics
           WHERE "eventType" = 'WHATSAPP_CLICK' AND "producerId" = :producerId AND "timestamp" >= :since) AS "whatsappClicks",
         (SELECT COUNT(*)::int FROM demand_metrics
           WHERE "eventType" = 'SEARCH_HIT' AND category IN (:categories) AND "timestamp" >= :since) AS "relatedSearches",
         (SELECT COUNT(*)::int FROM demand_metrics
           WHERE "eventType" = 'SEARCH_FAIL' AND category IN (:categories) AND "timestamp" >= :since) AS "relatedFails"`,
      { type: QueryTypes.SELECT, replacements: { producerId, categories, since } }
    );

    return row;
  }
}
