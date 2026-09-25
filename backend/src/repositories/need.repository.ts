import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Need, User } from '../models/index.js';
import { Category } from '../constants/catalog.constants.js';
import { INeedRepository } from '../interfaces/need-repository.interface.js';
import {
  ForProducerCandidate,
  NeedMatchCandidate,
  NeedPersistenceAttributes,
  NeedRecord,
  NeedSearchCriteria,
  NeedSearchResult,
  NeedWithAuthorRecord,
  UpdateNeedPersistenceAttributes
} from '../interfaces/need.types.js';
import { toPlainPoint } from '../utils/geo.js';

// Única clase que conoce Sequelize/SQL crudo para necesidades y su matching. El resto
// del dominio solo ve INeedRepository (DIP). Todo valor del usuario que entra en SQL
// crudo va con `replacements`, nunca interpolado en el string (regla de seguridad del plan).
export class SequelizeNeedRepository implements INeedRepository {
  private static readonly AUTHOR_INCLUDE = {
    model: User,
    as: 'author',
    attributes: ['id', 'name', 'phone', 'accountType', 'organizationName', 'institutionType', 'locality'],
    required: true
  };

  // Distancia en km entre la necesidad y el punto (:lng, :lat) del que consulta (GET /api/needs)
  private static readonly DISTANCE_KM_SQL = `ROUND((ST_Distance(
    "needs"."coordinates"::geography,
    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
  ) / 1000)::numeric, 1)`;

  async create(data: NeedPersistenceAttributes): Promise<NeedRecord> {
    const instance = await Need.create(data as any);
    return this.toRecord(instance);
  }

  async findById(id: number): Promise<NeedRecord | null> {
    const instance = await Need.findByPk(id);
    return instance ? this.toRecord(instance) : null;
  }

  async findByIdWithAuthor(id: number): Promise<NeedWithAuthorRecord | null> {
    const instance = await Need.findByPk(id, { include: [SequelizeNeedRepository.AUTHOR_INCLUDE] });
    return instance ? this.toRecordWithAuthor(instance) : null;
  }

  async update(id: number, data: UpdateNeedPersistenceAttributes): Promise<NeedRecord | null> {
    const instance: any = await Need.findByPk(id);
    if (!instance) {
      return null;
    }

    await instance.update(data as any);
    return this.toRecord(instance);
  }

  async findAllByUser(userId: number): Promise<NeedRecord[]> {
    const instances = await Need.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
    return instances.map((instance) => this.toRecord(instance));
  }

  async search(criteria: NeedSearchCriteria): Promise<NeedSearchResult> {
    const where: any[] = [{ status: criteria.status }];
    const replacements: Record<string, unknown> = {};

    if (criteria.category) {
      where.push({ category: criteria.category });
    }
    if (criteria.locality) {
      where.push({ locality: criteria.locality });
    }

    const hasCoords = criteria.lat !== undefined && criteria.lng !== undefined;
    if (hasCoords) {
      replacements.lat = criteria.lat;
      replacements.lng = criteria.lng;
    }

    const { rows, count } = await Need.findAndCountAll({
      where: { [Op.and]: where },
      include: [SequelizeNeedRepository.AUTHOR_INCLUDE],
      attributes: hasCoords
        ? { include: [[sequelize.literal(SequelizeNeedRepository.DISTANCE_KM_SQL), 'distanceKm']] }
        : undefined,
      limit: criteria.limit,
      offset: criteria.offset,
      order: hasCoords ? [[sequelize.literal('"distanceKm"'), 'ASC']] : [['createdAt', 'DESC']],
      replacements: Object.keys(replacements).length > 0 ? replacements : undefined
    });

    return {
      items: rows.map((instance) => this.toRecordWithAuthor(instance)),
      total: count
    };
  }

  async countOpen(): Promise<number> {
    return Need.count({ where: { status: 'OPEN' } });
  }

  async findAllOpenWithAuthor(): Promise<NeedWithAuthorRecord[]> {
    const instances = await Need.findAll({
      where: { status: 'OPEN' },
      include: [SequelizeNeedRepository.AUTHOR_INCLUDE],
      order: [['createdAt', 'DESC']]
    });
    return instances.map((instance) => this.toRecordWithAuthor(instance));
  }

  async findMatchCandidates(params: {
    category: Category;
    keywords: string[];
    lat: number;
    lng: number;
    radiusKm: number;
    since: Date;
  }): Promise<NeedMatchCandidate[]> {
    const patterns = params.keywords.map((keyword) => `%${keyword}%`);
    const textCondition = patterns.length > 0 ? "OR unaccent(p.title) ILIKE ANY(ARRAY[:patterns])" : '';

    const rows = await sequelize.query<{
      producerId: number;
      name: string;
      businessName: string;
      category: Category;
      phone: string | null;
      locality: string | null;
      address: string | null;
      paymentMethods: string[];
      deliveryOptions: string[];
      bio: string | null;
      distanceKm: string;
      matchingProducts: NeedMatchCandidate['matchingProducts'];
      whatsappClicks: number;
    }>(
      `SELECT
         u.id AS "producerId",
         u.name,
         pp."businessName" AS "businessName",
         pp.category,
         u.phone,
         u.locality,
         pp.address,
         pp."paymentMethods" AS "paymentMethods",
         pp."deliveryOptions" AS "deliveryOptions",
         pp.bio,
         ROUND((ST_Distance(
           u.coordinates::geography,
           ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
         ) / 1000)::numeric, 1) AS "distanceKm",
         COALESCE(
           (SELECT json_agg(json_build_object(
              'id', p.id, 'title', p.title, 'price', p.price, 'offerPrice', p."offerPrice",
              'isOffer', p."isOffer", 'stockUnit', p."stockUnit", 'imageUrl', p."imageUrl", 'category', p.category
            ))
            FROM products p
            WHERE p."producerId" = u.id AND p.available = true
              AND (p.category = :category ${textCondition})
           ), '[]'
         ) AS "matchingProducts",
         (SELECT COUNT(*)::int FROM demand_metrics dm
           WHERE dm."producerId" = u.id AND dm."eventType" = 'WHATSAPP_CLICK' AND dm."timestamp" >= :since) AS "whatsappClicks"
       FROM users u
       INNER JOIN producer_profiles pp ON pp."userId" = u.id
       WHERE u.role = 'PRODUCER'
         AND u.coordinates IS NOT NULL
         AND ST_DWithin(
           u.coordinates::geography,
           ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
           :radiusMeters
         )
         AND (
           pp.category = :category
           OR EXISTS (
             SELECT 1 FROM products p
             WHERE p."producerId" = u.id AND p.available = true
               AND (p.category = :category ${textCondition})
           )
         )`,
      {
        type: QueryTypes.SELECT,
        replacements: {
          category: params.category,
          patterns,
          lat: params.lat,
          lng: params.lng,
          radiusMeters: params.radiusKm * 1000,
          since: params.since
        }
      }
    );

    return rows.map((row) => ({
      producerId: row.producerId,
      name: row.name,
      businessName: row.businessName,
      category: row.category,
      phone: row.phone,
      locality: row.locality,
      address: row.address,
      paymentMethods: row.paymentMethods,
      deliveryOptions: row.deliveryOptions,
      bio: row.bio,
      distanceKm: Number(row.distanceKm),
      matchingProducts: (row.matchingProducts ?? []).map((product) => ({
        ...product,
        price: Number(product.price),
        offerPrice: product.offerPrice !== null ? Number(product.offerPrice) : null
      })),
      whatsappClicks: row.whatsappClicks
    }));
  }

  async findForProducer(params: {
    producerId: number;
    categories: Category[];
    keywordsByCategory: string[];
    lat: number;
    lng: number;
  }): Promise<ForProducerCandidate[]> {
    const patterns = params.keywordsByCategory.map((keyword) => `%${keyword}%`);
    const textCondition = patterns.length > 0 ? "OR unaccent(n.title) ILIKE ANY(ARRAY[:patterns])" : '';

    const rows = await sequelize.query<any>(
      `SELECT
         n.id, n."userId", n.title, n.description, n.category, n.quantity, n.unit, n.frequency,
         n.locality, n.coordinates, n."radiusKm", n.status, n."createdAt",
         u.name AS "authorName", u.phone AS "authorPhone", u."accountType" AS "authorAccountType",
         u."organizationName" AS "authorOrganizationName", u."institutionType" AS "authorInstitutionType",
         u.locality AS "authorLocality",
         ROUND((ST_Distance(
           n.coordinates::geography,
           ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
         ) / 1000)::numeric, 1) AS "distanceKm"
       FROM needs n
       INNER JOIN users u ON u.id = n."userId"
       WHERE n.status = 'OPEN'
         AND n."userId" != :producerId
         AND ST_DWithin(
           n.coordinates::geography,
           ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
           n."radiusKm" * 1000
         )
         AND (n.category IN (:categories) ${textCondition})
       ORDER BY n."createdAt" DESC`,
      {
        type: QueryTypes.SELECT,
        replacements: {
          producerId: params.producerId,
          categories: params.categories,
          patterns,
          lat: params.lat,
          lng: params.lng
        }
      }
    );

    return rows.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description,
      category: row.category,
      quantity: Number(row.quantity),
      unit: row.unit,
      frequency: row.frequency,
      locality: row.locality,
      coordinates: toPlainPoint(row.coordinates)!,
      radiusKm: row.radiusKm,
      status: row.status,
      createdAt: row.createdAt,
      distanceKm: Number(row.distanceKm),
      author: {
        id: row.userId,
        name: row.authorName,
        phone: row.authorPhone,
        accountType: row.authorAccountType,
        organizationName: row.authorOrganizationName,
        institutionType: row.authorInstitutionType,
        locality: row.authorLocality
      }
    }));
  }

  private toRecord(instance: any): NeedRecord {
    return this.mapPlainToRecord(instance.get({ plain: true }));
  }

  private toRecordWithAuthor(instance: any): NeedWithAuthorRecord {
    const plain = instance.get({ plain: true });
    return {
      ...this.mapPlainToRecord(plain),
      author: {
        id: plain.author.id,
        name: plain.author.name,
        phone: plain.author.phone,
        accountType: plain.author.accountType,
        organizationName: plain.author.organizationName,
        institutionType: plain.author.institutionType,
        locality: plain.author.locality
      },
      ...(plain.distanceKm !== undefined && plain.distanceKm !== null ? { distanceKm: Number(plain.distanceKm) } : {})
    };
  }

  private mapPlainToRecord(plain: any): NeedRecord {
    return {
      id: plain.id,
      userId: plain.userId,
      title: plain.title,
      description: plain.description,
      category: plain.category,
      // DECIMAL llega desde Postgres como string
      quantity: Number(plain.quantity),
      unit: plain.unit,
      frequency: plain.frequency,
      locality: plain.locality,
      coordinates: toPlainPoint(plain.coordinates)!,
      radiusKm: plain.radiusKm,
      status: plain.status,
      createdAt: plain.createdAt
    };
  }
}
