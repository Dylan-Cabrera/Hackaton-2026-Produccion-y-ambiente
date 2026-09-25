import { Category, StockUnit } from '../constants/catalog.constants.js';

// Query params de GET /api/recommendations/b2b
export interface B2BRecommendationOptions {
  radiusKm?: number;
  limit?: number;
}

export interface B2BRecommendationProduct {
  id: number;
  title: string;
  price: number;
  offerPrice: number | null;
  isOffer: boolean;
  stockUnit: StockUnit;
  imageUrl: string | null;
}

export interface B2BRecommendationProducer {
  id: number;
  businessName: string;
  phone: string | null;
  locality: string | null;
}

export interface B2BRecommendationItem {
  matchedInput: Category;
  distanceKm: number;
  product: B2BRecommendationProduct;
  producer: B2BRecommendationProducer;
}

export interface B2BRecommendationResponse {
  producerCategory: Category;
  inputs: Category[];
  radiusKm: number;
  recommendations: B2BRecommendationItem[];
}
