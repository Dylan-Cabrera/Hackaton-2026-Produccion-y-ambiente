import { Category, StockUnit } from '../constants/catalog.constants.js';
import { GeoJSONPoint } from './geo.types.js';

// Body de POST /api/products
export interface CreateProductInput {
  title: string;
  description?: string | null;
  category?: Category;
  price: number;
  offerPrice?: number | null;
  isOffer?: boolean;
  stockUnit: StockUnit;
  imageUrl?: string | null;
}

// Body de PATCH /api/products/:id (edición parcial)
export interface UpdateProductInput {
  title?: string;
  description?: string | null;
  category?: Category;
  price?: number;
  offerPrice?: number | null;
  isOffer?: boolean;
  stockUnit?: StockUnit;
  imageUrl?: string | null;
  available?: boolean;
}

export interface ProductPersistenceAttributes {
  producerId: number;
  title: string;
  description: string | null;
  category: Category;
  price: number;
  offerPrice: number | null;
  isOffer: boolean;
  stockUnit: StockUnit;
  imageUrl: string | null;
  available: boolean;
}

export type UpdateProductPersistenceAttributes = Partial<Omit<ProductPersistenceAttributes, 'producerId'>>;

// Fila tal como la arma el repositorio (price/offerPrice ya convertidos a number)
export interface ProductRecord {
  id: number;
  producerId: number;
  title: string;
  description: string | null;
  category: Category;
  price: number;
  offerPrice: number | null;
  isOffer: boolean;
  stockUnit: StockUnit;
  imageUrl: string | null;
  available: boolean;
  createdAt: Date;
}

// Forma pública (misma para el propio inventario y para el listado de un productor)
export interface PublicProduct {
  id: number;
  title: string;
  description: string | null;
  category: Category;
  price: number;
  offerPrice: number | null;
  isOffer: boolean;
  stockUnit: StockUnit;
  imageUrl: string | null;
  available: boolean;
  createdAt: Date;
}

// Datos del productor embebidos en un resultado de búsqueda (GET /api/products)
export interface ProductProducerSummary {
  id: number;
  businessName: string;
  phone: string | null;
  locality: string | null;
  coordinates: GeoJSONPoint | null;
}

export interface ProductWithProducerRecord extends ProductRecord {
  producer: ProductProducerSummary;
}

export interface PublicProductWithProducer extends PublicProduct {
  producer: ProductProducerSummary;
}

// Query params de GET /api/products, ya validados/saneados
export interface SearchProductsInput {
  q?: string;
  category?: Category;
  isOffer?: boolean;
  limit?: number;
  offset?: number;
}

export interface ProductSearchCriteria {
  q?: string;
  category?: Category;
  isOffer?: boolean;
  limit: number;
  offset: number;
}

export interface ProductSearchResult {
  items: ProductWithProducerRecord[];
  total: number;
}

export interface ProductSearchResponse {
  items: PublicProductWithProducer[];
  limit: number;
  offset: number;
  total: number;
}
