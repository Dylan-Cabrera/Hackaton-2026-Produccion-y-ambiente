import { Category } from '../constants/catalog.constants.js';
import { GeoJSONPoint, CoordinatesTuple } from './geo.types.js';

// Filas que van a la tabla `producer_profiles`
export interface ProducerProfilePersistenceAttributes {
  businessName: string;
  category: Category;
  address: string | null;
  paymentMethods: string[];
  deliveryOptions: string[];
  bio: string | null;
}

export interface UpdateProducerPersistenceAttributes {
  user?: Partial<{
    name: string;
    phone: string;
    locality: string;
    coordinates: GeoJSONPoint & { crs?: unknown };
  }>;
  profile?: Partial<ProducerProfilePersistenceAttributes>;
}

// Registro plano tal como lo arma el repositorio (join de `users` + `producer_profiles`)
export interface ProducerRecord {
  id: number;
  name: string;
  phone: string | null;
  coordinates: GeoJSONPoint | null;
  createdAt: Date;
  producerProfile: {
    businessName: string;
    category: Category;
    address: string | null;
    paymentMethods: string[];
    deliveryOptions: string[];
    bio: string | null;
  };
}

// Forma pública del perfil de productor (GET /api/producers/:id). No cambia entre versiones.
export interface PublicProducerProfile {
  id: number;
  name: string;
  businessName: string;
  category: Category;
  phone: string;
  location: { address: string; coordinates: GeoJSONPoint };
  paymentMethods: string[];
  deliveryOptions: string[];
  bio: string | null;
  createdAt: Date;
}

// Body de PUT /api/producers/profile: datos del emprendimiento + campos de cuenta,
// editados en una sola transacción.
export interface UpdateProducerProfileInput {
  name?: string;
  phone?: string;
  locality?: string;
  coordinates?: CoordinatesTuple;
  businessName?: string;
  category?: Category;
  address?: string;
  paymentMethods?: string[];
  deliveryOptions?: string[];
  bio?: string | null;
}
