import { Category } from '../constants/catalog.constants.js';
import { Role } from '../constants/user.constants.js';

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
  category: Category;
  phone: string;
  email: string;
  password: string;
  location: LocationInput;
  paymentMethods?: string[];
  deliveryOptions?: string[];
  bio?: string | null;
}

// Filas que van a la tabla `users` (password ya hasheado)
export interface UserPersistenceAttributes {
  role: Role;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  locality: string | null;
  coordinates: (GeoJSONPoint & { crs?: unknown }) | null;
}

// Filas que van a la tabla `producer_profiles`
export interface ProducerProfilePersistenceAttributes {
  businessName: string;
  category: Category;
  address: string | null;
  paymentMethods: string[];
  deliveryOptions: string[];
  bio: string | null;
}

// Lo que arma el mapper para crear un productor: dos tablas, una sola transacción
export interface ProducerPersistenceAttributes {
  user: UserPersistenceAttributes;
  profile: ProducerProfilePersistenceAttributes;
}

export interface UpdateProducerPersistenceAttributes {
  user?: Partial<UserPersistenceAttributes>;
  profile?: Partial<ProducerProfilePersistenceAttributes>;
}

// Registro plano tal como lo arma el repositorio (join de `users` + `producer_profiles`)
export interface ProducerRecord {
  id: number;
  name: string;
  email: string;
  password: string;
  phone: string;
  coordinates: GeoJSONPoint;
  createdAt: Date;
  producerProfile: {
    businessName: string;
    category: Category;
    address: string;
    paymentMethods: string[];
    deliveryOptions: string[];
    bio: string | null;
  };
}

// Forma pública (nunca incluye el password)
export interface PublicProducerProfile {
  id: number;
  name: string;
  businessName: string;
  category: Category;
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
  category?: Category;
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
