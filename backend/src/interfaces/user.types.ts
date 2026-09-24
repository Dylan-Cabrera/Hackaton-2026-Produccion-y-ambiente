import { Role, AccountType } from '../constants/user.constants.js';
import { Category, InstitutionType } from '../constants/catalog.constants.js';
import { GeoJSONPoint, CoordinatesTuple } from './geo.types.js';

// Perfil de emprendimiento embebido en la cuenta cuando role = 'PRODUCER'
export interface EmbeddedProducerProfile {
  businessName: string;
  category: Category;
  address: string | null;
  paymentMethods: string[];
  deliveryOptions: string[];
  bio: string | null;
}

// Body crudo de POST /api/auth/register. La validación específica por rol vive en el validator.
export interface RegisterInput {
  role: Role;
  name: string;
  email: string;
  password: string;
  phone?: string;
  locality?: string;
  coordinates?: CoordinatesTuple;
  // Solo CONSUMER
  accountType?: AccountType;
  organizationName?: string;
  institutionType?: InstitutionType;
  // Solo PRODUCER
  businessName?: string;
  category?: Category;
  address?: string;
  paymentMethods?: string[];
  deliveryOptions?: string[];
  bio?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

// Body de PUT /api/users/me
export interface UpdateUserInput {
  name?: string;
  phone?: string;
  locality?: string;
  coordinates?: CoordinatesTuple;
  organizationName?: string;
  institutionType?: InstitutionType;
}

// Filas que van a la tabla `users`
export interface UserPersistenceAttributes {
  role: Role;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  locality: string | null;
  coordinates: (GeoJSONPoint & { crs?: unknown }) | null;
  accountType: AccountType | null;
  organizationName: string | null;
  institutionType: InstitutionType | null;
}

export interface CreateUserPersistenceAttributes {
  user: UserPersistenceAttributes;
  // Solo cuando role = 'PRODUCER': se crea en la misma transacción
  producerProfile?: EmbeddedProducerProfile;
}

export type UpdateUserPersistenceAttributes = Partial<UserPersistenceAttributes>;

// Registro plano tal como lo arma el repositorio (`users` + `producer_profiles` si existe)
export interface UserRecord {
  id: number;
  role: Role;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  locality: string | null;
  coordinates: GeoJSONPoint | null;
  accountType: AccountType | null;
  organizationName: string | null;
  institutionType: InstitutionType | null;
  createdAt: Date;
  producerProfile: EmbeddedProducerProfile | null;
}

// Forma pública de la cuenta (UserMapper.toPublic)
export interface PublicUserProfile {
  id: number;
  role: Role;
  name: string;
  locality: string | null;
  coordinates: GeoJSONPoint | null;
  // Solo si la cuenta consultada es la propia
  email?: string;
  phone?: string | null;
  accountType?: AccountType | null;
  organizationName?: string | null;
  institutionType?: InstitutionType | null;
  // Solo si role = 'PRODUCER'
  producerProfile?: EmbeddedProducerProfile;
}

export interface AuthResult {
  user: PublicUserProfile;
  token: string;
}
