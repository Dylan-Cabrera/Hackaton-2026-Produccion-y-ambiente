import { Category } from '../constants/catalog.constants.js';
import {
  NeedPersistenceAttributes,
  NeedRecord,
  NeedSearchCriteria,
  NeedSearchResult,
  NeedWithAuthorRecord,
  UpdateNeedPersistenceAttributes,
  NeedMatchCandidate,
  ForProducerCandidate
} from './need.types.js';

// Abstracción de la persistencia de necesidades (Dependency Inversion + Interface Segregation):
// los servicios de dominio no conocen Sequelize, solo este contrato.
export interface INeedRepository {
  create(data: NeedPersistenceAttributes): Promise<NeedRecord>;
  findById(id: number): Promise<NeedRecord | null>;
  findByIdWithAuthor(id: number): Promise<NeedWithAuthorRecord | null>;
  update(id: number, data: UpdateNeedPersistenceAttributes): Promise<NeedRecord | null>;
  findAllByUser(userId: number): Promise<NeedRecord[]>;

  // Listado público (HU-11): siempre status = 'OPEN'
  search(criteria: NeedSearchCriteria): Promise<NeedSearchResult>;

  // Usados por la analítica (HU-07/HU-08) para medir demanda insatisfecha explícita
  countOpen(): Promise<number>;
  findAllOpenWithAuthor(): Promise<NeedWithAuthorRecord[]>;

  // Candidatos a productor para GET /api/needs/:id/matches
  findMatchCandidates(params: {
    category: Category;
    keywords: string[];
    lat: number;
    lng: number;
    radiusKm: number;
    since: Date;
  }): Promise<NeedMatchCandidate[]>;

  // Necesidades OPEN que un productor podría cubrir (GET /api/needs/for-me)
  findForProducer(params: {
    producerId: number;
    categories: Category[];
    keywordsByCategory: string[];
    lat: number;
    lng: number;
  }): Promise<ForProducerCandidate[]>;
}
