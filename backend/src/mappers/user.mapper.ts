import { WGS84_SRID } from '../constants/catalog.constants.js';
import { localityCentroid } from '../utils/geo.js';
import { CoordinatesTuple } from '../interfaces/geo.types.js';
import {
  CreateUserPersistenceAttributes,
  PublicUserProfile,
  RegisterInput,
  UpdateUserInput,
  UpdateUserPersistenceAttributes,
  UserRecord
} from '../interfaces/user.types.js';

// Responsabilidad única: traducir entre las distintas formas de una cuenta
// (entrada de la API, filas de `users` + `producer_profiles`, respuesta pública).
export class UserMapper {
  static toPersistence(input: RegisterInput, passwordHash: string): CreateUserPersistenceAttributes {
    const coordinates = input.coordinates ?? this.inferCoordinates(input.locality);

    const user: CreateUserPersistenceAttributes['user'] = {
      role: input.role,
      name: input.name,
      email: input.email,
      password: passwordHash,
      phone: input.phone ?? null,
      locality: input.locality ?? null,
      coordinates: coordinates
        ? {
            type: 'Point',
            coordinates,
            // Necesario para que PostGIS asigne el SRID de la columna
            crs: { type: 'name', properties: { name: `EPSG:${WGS84_SRID}` } }
          }
        : null,
      accountType: input.role === 'CONSUMER' ? input.accountType ?? null : null,
      organizationName: input.role === 'CONSUMER' ? input.organizationName ?? null : null,
      institutionType: input.role === 'CONSUMER' ? input.institutionType ?? null : null
    };

    if (input.role !== 'PRODUCER') {
      return { user };
    }

    return {
      user,
      // El validator garantiza businessName/category cuando role = 'PRODUCER'
      producerProfile: {
        businessName: input.businessName as string,
        category: input.category!,
        address: input.address ?? null,
        paymentMethods: input.paymentMethods ?? [],
        deliveryOptions: input.deliveryOptions ?? [],
        bio: input.bio ?? null
      }
    };
  }

  static toUpdatePersistence(input: UpdateUserInput): UpdateUserPersistenceAttributes {
    const data: UpdateUserPersistenceAttributes = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.locality !== undefined) data.locality = input.locality;
    if (input.organizationName !== undefined) data.organizationName = input.organizationName;
    if (input.institutionType !== undefined) data.institutionType = input.institutionType;
    if (input.coordinates !== undefined) {
      data.coordinates = {
        type: 'Point',
        coordinates: input.coordinates,
        crs: { type: 'name', properties: { name: `EPSG:${WGS84_SRID}` } }
      };
    }

    return data;
  }

  static toPublic(record: UserRecord, { own = false } = {}): PublicUserProfile {
    const profile: PublicUserProfile = {
      id: record.id,
      role: record.role,
      name: record.name,
      locality: record.locality,
      coordinates: record.coordinates,
      createdAt: record.createdAt
    };

    if (own) {
      profile.email = record.email;
      profile.phone = record.phone;
      profile.accountType = record.accountType;
      profile.organizationName = record.organizationName;
      profile.institutionType = record.institutionType;
    }

    if (record.role === 'PRODUCER' && record.producerProfile) {
      profile.producerProfile = record.producerProfile;
    }

    return profile;
  }

  // Si no llegan coordenadas pero sí una localidad conocida, se usa su centroide (plan 0.2)
  private static inferCoordinates(locality?: string): CoordinatesTuple | undefined {
    if (!locality) {
      return undefined;
    }
    const centroid = localityCentroid(locality);
    return centroid ? [centroid.lng, centroid.lat] : undefined;
  }
}
