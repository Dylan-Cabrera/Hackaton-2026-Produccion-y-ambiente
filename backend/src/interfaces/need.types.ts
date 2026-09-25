import { Category, InstitutionType, NeedFrequency, NeedStatus, StockUnit } from '../constants/catalog.constants.js';
import { AccountType } from '../constants/user.constants.js';
import { GeoJSONPoint, CoordinatesTuple } from './geo.types.js';

// Body de POST /api/needs
export interface CreateNeedInput {
  title: string;
  description?: string | null;
  category: Category;
  quantity: number;
  unit: StockUnit;
  frequency?: NeedFrequency;
  locality?: string;
  coordinates?: CoordinatesTuple;
  radiusKm?: number;
}

// Body de PATCH /api/needs/:id
export interface UpdateNeedInput {
  title?: string;
  description?: string | null;
  category?: Category;
  quantity?: number;
  unit?: StockUnit;
  frequency?: NeedFrequency;
  locality?: string;
  coordinates?: CoordinatesTuple;
  radiusKm?: number;
  status?: NeedStatus;
}

export interface NeedPersistenceAttributes {
  userId: number;
  title: string;
  description: string | null;
  category: Category;
  quantity: number;
  unit: StockUnit;
  frequency: NeedFrequency;
  locality: string;
  coordinates: GeoJSONPoint & { crs?: unknown };
  radiusKm: number;
  status: NeedStatus;
}

export type UpdateNeedPersistenceAttributes = Partial<Omit<NeedPersistenceAttributes, 'userId'>>;

// Fila tal como la arma el repositorio
export interface NeedRecord {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  category: Category;
  quantity: number;
  unit: StockUnit;
  frequency: NeedFrequency;
  locality: string;
  coordinates: GeoJSONPoint;
  radiusKm: number;
  status: NeedStatus;
  createdAt: Date;
}

// Datos del autor embebidos en un listado/detalle público
export interface NeedAuthorSummary {
  displayName: string;
  accountType: AccountType | null;
  institutionType: InstitutionType | null;
  locality: string | null;
  // Solo se completa si quien consulta puede verlo (PRODUCER o el propio autor)
  phone?: string | null;
}

export interface NeedWithAuthorRecord extends NeedRecord {
  author: {
    id: number;
    name: string;
    phone: string | null;
    accountType: AccountType | null;
    organizationName: string | null;
    institutionType: InstitutionType | null;
    locality: string | null;
  };
  distanceKm?: number;
}

// Forma pública de una necesidad (listados y detalle)
export interface PublicNeed {
  id: number;
  title: string;
  description: string | null;
  category: Category;
  quantity: number;
  unit: StockUnit;
  frequency: NeedFrequency;
  locality: string;
  coordinates: GeoJSONPoint;
  radiusKm: number;
  status: NeedStatus;
  createdAt: Date;
  author: NeedAuthorSummary;
  distanceKm?: number;
}

export interface PublicNeedWithMatchCount extends PublicNeed {
  matchCount: number;
}

// Query params de GET /api/needs
export interface SearchNeedsInput {
  category?: Category;
  locality?: string;
  lat?: number;
  lng?: number;
  limit?: number;
  offset?: number;
}

export interface NeedSearchCriteria {
  status: NeedStatus;
  category?: Category;
  locality?: string;
  lat?: number;
  lng?: number;
  limit: number;
  offset: number;
}

export interface NeedSearchResult {
  items: NeedWithAuthorRecord[];
  total: number;
}

export interface NeedSearchResponse {
  items: PublicNeed[];
  limit: number;
  offset: number;
  total: number;
}

// --- Matching (need-matching.service.ts) ---

export interface MatchingProduct {
  id: number;
  title: string;
  price: number;
  offerPrice: number | null;
  isOffer: boolean;
  stockUnit: StockUnit;
  imageUrl: string | null;
  category: Category;
}

// Productor candidato tal como lo trae el repositorio, con los productos que ya
// cumplen alguna condición de coincidencia (texto o categoría)
export interface NeedMatchCandidate {
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
  distanceKm: number;
  matchingProducts: MatchingProduct[];
  whatsappClicks: number;
}

export interface NeedMatch {
  score: number;
  distanceKm: number;
  reasons: string[];
  producer: {
    id: number;
    name: string;
    businessName: string;
    category: Category;
    phone: string | null;
    locality: string | null;
    address: string | null;
    paymentMethods: string[];
    deliveryOptions: string[];
    bio: string | null;
  };
  matchingProducts: MatchingProduct[];
}

// Query params de GET /api/needs/:id/matches
export interface GetMatchesOptions {
  radiusKm?: number;
  limit?: number;
}

export interface NeedMatchesResponse {
  need: {
    id: number;
    title: string;
    quantity: number;
    unit: StockUnit;
    frequency: NeedFrequency;
    radiusKm: number;
  };
  matches: NeedMatch[];
}

// GET /api/needs/for-me: necesidad candidata desde el punto de vista del productor
export interface ForProducerCandidate extends NeedRecord {
  distanceKm: number;
  author: {
    name: string;
    phone: string | null;
    accountType: AccountType | null;
    organizationName: string | null;
    institutionType: InstitutionType | null;
    locality: string | null;
  };
}

export interface ForProducerNeed {
  id: number;
  title: string;
  description: string | null;
  category: Category;
  quantity: number;
  unit: StockUnit;
  frequency: NeedFrequency;
  locality: string;
  radiusKm: number;
  createdAt: Date;
  distanceKm: number;
  author: NeedAuthorSummary;
  matchedProducts: MatchingProduct[];
}
