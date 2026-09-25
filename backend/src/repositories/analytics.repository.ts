import { QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Category } from '../constants/catalog.constants.js';
import { IAnalyticsRepository } from '../interfaces/analytics-repository.interface.js';
import {
  ClicksByLocality,
  TopTerm,
  ProducersByCategory,
  TopCategory,
  SupplyPoint,
  HeatCell,
  Opportunity
} from '../interfaces/analytics.types.js';

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

  // --- HU-08: dashboard provincial (admin) ---

  async getAccountCounts(): Promise<{ producers: number; consumers: number; institutions: number }> {
    const [row] = await sequelize.query<{ producers: number; consumers: number; institutions: number }>(
      `SELECT
         (SELECT COUNT(*)::int FROM users WHERE role = 'PRODUCER') AS "producers",
         (SELECT COUNT(*)::int FROM users WHERE role = 'CONSUMER' AND "accountType" IS DISTINCT FROM 'INSTITUCION') AS "consumers",
         (SELECT COUNT(*)::int FROM users WHERE role = 'CONSUMER' AND "accountType" = 'INSTITUCION') AS "institutions"`,
      { type: QueryTypes.SELECT }
    );

    return row;
  }

  async getProductCounts(): Promise<{ activeProducts: number; activeOffers: number }> {
    const [row] = await sequelize.query<{ activeProducts: number; activeOffers: number }>(
      `SELECT
         COUNT(*)::int AS "activeProducts",
         COUNT(*) FILTER (WHERE "isOffer" = true)::int AS "activeOffers"
       FROM products
       WHERE available = true`,
      { type: QueryTypes.SELECT }
    );

    return row;
  }

  async getSearchStats(since: Date): Promise<{ searches: number; fails: number; whatsappClicks: number }> {
    const [row] = await sequelize.query<{ searches: number; fails: number; whatsappClicks: number }>(
      `SELECT
         (SELECT COUNT(*)::int FROM demand_metrics
           WHERE "eventType" IN ('SEARCH_HIT', 'SEARCH_FAIL') AND "timestamp" >= :since) AS "searches",
         (SELECT COUNT(*)::int FROM demand_metrics
           WHERE "eventType" = 'SEARCH_FAIL' AND "timestamp" >= :since) AS "fails",
         (SELECT COUNT(*)::int FROM demand_metrics
           WHERE "eventType" = 'WHATSAPP_CLICK' AND "timestamp" >= :since) AS "whatsappClicks"`,
      { type: QueryTypes.SELECT, replacements: { since } }
    );

    return row;
  }

  async getProducersByCategory(): Promise<ProducersByCategory[]> {
    return sequelize.query<ProducersByCategory>(
      `SELECT category, COUNT(*)::int AS count
       FROM producer_profiles
       GROUP BY category
       ORDER BY count DESC`,
      { type: QueryTypes.SELECT }
    );
  }

  async getTopCategoriesBySearches(since: Date, limit: number): Promise<TopCategory[]> {
    return sequelize.query<TopCategory>(
      `SELECT category, COUNT(*)::int AS searches
       FROM demand_metrics
       WHERE "eventType" IN ('SEARCH_HIT', 'SEARCH_FAIL')
         AND "timestamp" >= :since
         AND category IS NOT NULL
       GROUP BY category
       ORDER BY searches DESC
       LIMIT :limit`,
      { type: QueryTypes.SELECT, replacements: { since, limit } }
    );
  }

  async getTopTermsGlobal(since: Date, limit: number): Promise<TopTerm[]> {
    return sequelize.query<TopTerm>(
      `SELECT "queryTerm" AS term,
              COUNT(*)::int AS count,
              COUNT(*) FILTER (WHERE "eventType" = 'SEARCH_FAIL')::int AS fails
       FROM demand_metrics
       WHERE "eventType" IN ('SEARCH_HIT', 'SEARCH_FAIL')
         AND "timestamp" >= :since
         AND "queryTerm" IS NOT NULL
       GROUP BY "queryTerm"
       ORDER BY count DESC
       LIMIT :limit`,
      { type: QueryTypes.SELECT, replacements: { since, limit } }
    );
  }

  async getSupply(category?: Category): Promise<SupplyPoint[]> {
    const categoryFilter = category ? 'AND pp.category = :category' : '';

    return sequelize.query<SupplyPoint>(
      `SELECT u.id, pp."businessName" AS "businessName", pp.category, u.locality,
              ST_Y(u.coordinates::geometry) AS lat, ST_X(u.coordinates::geometry) AS lng
       FROM users u
       INNER JOIN producer_profiles pp ON pp."userId" = u.id
       WHERE u.coordinates IS NOT NULL
         AND EXISTS (SELECT 1 FROM products p WHERE p."producerId" = u.id AND p.available = true)
         ${categoryFilter}
       ORDER BY pp."businessName"`,
      { type: QueryTypes.SELECT, replacements: { category } }
    );
  }

  async getUnmetHeat(since: Date, category?: Category): Promise<HeatCell[]> {
    const categoryFilter = category ? 'AND category = :category' : '';

    const rows = await sequelize.query<{ lat: number; lng: number; weight: number }>(
      `SELECT ST_Y(ST_SnapToGrid(coordinates::geometry, 0.02)) AS lat,
              ST_X(ST_SnapToGrid(coordinates::geometry, 0.02)) AS lng,
              COUNT(*)::int AS weight
       FROM demand_metrics
       WHERE "eventType" = 'SEARCH_FAIL'
         AND coordinates IS NOT NULL
         AND "timestamp" >= :since
         ${categoryFilter}
       GROUP BY 1, 2
       ORDER BY weight DESC`,
      { type: QueryTypes.SELECT, replacements: { since, category } }
    );

    return rows.map((row) => [row.lat, row.lng, row.weight]);
  }

  async getOpportunities(since: Date, category: Category | undefined, limit: number): Promise<Opportunity[]> {
    const categoryFilter = category ? 'AND category = :category' : '';

    return sequelize.query<Opportunity>(
      `WITH fails AS (
         SELECT locality, "queryTerm" AS term, COUNT(*)::int AS cnt
         FROM demand_metrics
         WHERE "eventType" = 'SEARCH_FAIL'
           AND "timestamp" >= :since
           AND locality IS NOT NULL
           AND "queryTerm" IS NOT NULL
           ${categoryFilter}
         GROUP BY locality, "queryTerm"
       ),
       locality_fails AS (
         SELECT locality,
                SUM(cnt)::int AS fails,
                (ARRAY_AGG(term ORDER BY cnt DESC))[1:3] AS "topTerms"
         FROM fails
         GROUP BY locality
       ),
       producer_counts AS (
         SELECT locality, COUNT(*)::int AS producers
         FROM users
         WHERE role = 'PRODUCER' AND locality IS NOT NULL
         GROUP BY locality
       )
       SELECT lf.locality,
              lf.fails,
              0 AS "unmetNeeds",
              COALESCE(lf."topTerms", ARRAY[]::text[]) AS "topTerms",
              COALESCE(pc.producers, 0) AS producers
       FROM locality_fails lf
       LEFT JOIN producer_counts pc ON pc.locality = lf.locality
       ORDER BY lf.fails DESC
       LIMIT :limit`,
      { type: QueryTypes.SELECT, replacements: { since, category, limit } }
    );
  }
}
