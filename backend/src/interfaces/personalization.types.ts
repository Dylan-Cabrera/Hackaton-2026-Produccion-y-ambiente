import { Category, StockUnit } from '../constants/catalog.constants.js';

// Query params de GET /api/recommendations/for-you
export interface ForYouOptions {
  lat?: number;
  lng?: number;
  limit?: number;
}

export type RecommendationReasonType = 'NOW_AVAILABLE' | 'SEARCHED' | 'CATEGORY' | 'POPULAR_NEAR';

export interface RecommendationReason {
  type: RecommendationReasonType;
  label: string;
}

export interface ForYouProduct {
  id: number;
  title: string;
  price: number;
  offerPrice: number | null;
  isOffer: boolean;
  stockUnit: StockUnit;
  imageUrl: string | null;
  distanceKm: number | null;
  producer: {
    id: number;
    businessName: string;
    phone: string | null;
    locality: string | null;
  };
}

export interface ForYouItem {
  score: number;
  reason: RecommendationReason;
  product: ForYouProduct;
}

export interface ForYouResponse {
  coldStart: boolean;
  items: ForYouItem[];
}

// Término reciente ya deduplicado, con si su última aparición fue una búsqueda fallida
export interface RecentTerm {
  term: string;
  failed: boolean;
}

// Mapa de afinidad por categoría, ya normalizado (0 a 1)
export type CategoryAffinity = Map<Category, number>;
