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
  // Solo presente cuando la búsqueda llegó con lat/lng (HU-04)
  distanceKm?: number;
}

export interface PublicProductWithProducer extends PublicProduct {
  producer: ProductProducerSummary;
  distanceKm?: number;
}

// Query params de GET /api/products, ya validados/saneados
export interface SearchProductsInput {
  q?: string;
  category?: Category;
  isOffer?: boolean;
  limit?: number;
  offset?: number;
  // Posición del comprador (HU-04). lat/lng siempre vienen juntos; maxDistance los requiere.
  lat?: number;
  lng?: number;
  maxDistance?: number;
}

export interface ProductSearchCriteria {
  q?: string;
  category?: Category;
  // Filtro "category IN (...)" para matching por rubro (HU-05/HU-11); no lo usa la búsqueda pública
  categories?: Category[];
  isOffer?: boolean;
  limit: number;
  offset: number;
  lat?: number;
  lng?: number;
  maxDistance?: number;
  // Excluye los productos de un productor (para no recomendarse a uno mismo, HU-05)
  excludeProducerId?: number;
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
