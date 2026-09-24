import { ProducerCategory } from '../constants/producer.constants.js';

export type CoordinatesTuple = [number, number]; // [longitud, latitud]

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: CoordinatesTuple;
}

export interface LocationInput {
  address: string;
  coordinates: CoordinatesTuple;
}

// Datos crudos recibidos al registrar un productor
export interface CreateProducerInput {
  name: string;
  businessName: string;
  category: ProducerCategory;
  phone: string;
  email: string;
  password: string;
  location: LocationInput;
  paymentMethods?: string[];
  deliveryOptions?: string[];
  bio?: string | null;
}

// Forma exacta que espera la tabla (password ya hasheado)
export interface ProducerPersistenceAttributes {
  name: string;
  businessName: string;
  category: ProducerCategory;
  phone: string;
  email: string;
  password: string;
  address: string;
  coordinates: GeoJSONPoint & { crs?: unknown };
  paymentMethods: string[];
  deliveryOptions: string[];
  bio: string | null;
}

// Registro completo tal como vive en la base de datos
export interface ProducerRecord {
  id: number;
  name: string;
  businessName: string;
  category: ProducerCategory;
  phone: string;
  email: string;
  password: string;
  address: string;
  coordinates: GeoJSONPoint;
  paymentMethods: string[];
  deliveryOptions: string[];
  bio: string | null;
  createdAt: Date;
}

// Forma pública (nunca incluye el password)
export interface PublicProducerProfile {
  id: number;
  name: string;
  businessName: string;
  category: ProducerCategory;
  phone: string;
  email?: string;
  location: { address: string; coordinates: GeoJSONPoint };
  paymentMethods: string[];
  deliveryOptions: string[];
  bio: string | null;
  createdAt: Date;
}

// Datos parciales para actualizar un productor (todos los campos opcionales)
export interface UpdateProducerInput {
  name?: string;
  businessName?: string;
  category?: ProducerCategory;
  phone?: string;
  location?: LocationInput;
  paymentMethods?: string[];
  deliveryOptions?: string[];
  bio?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  producer: PublicProducerProfile;
  token: string;
}
