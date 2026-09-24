import { Category, StockUnit } from '../constants/catalog.constants.js';

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
