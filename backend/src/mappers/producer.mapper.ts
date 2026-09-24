import { WGS84_SRID } from '../constants/catalog.constants.js';
import {
  CreateProducerInput,
  ProducerPersistenceAttributes,
  ProducerProfilePersistenceAttributes,
  ProducerRecord,
  PublicProducerProfile,
  UpdateProducerInput,
  UpdateProducerPersistenceAttributes,
  UserPersistenceAttributes
} from '../interfaces/producer.types.js';

// Responsabilidad única: traducir entre las distintas formas de un productor
// (entrada de la API, filas de `users` + `producer_profiles`, respuesta pública).
export class ProducerMapper {
  static toPersistence(input: CreateProducerInput, passwordHash: string): ProducerPersistenceAttributes {
    return {
      user: {
        role: 'PRODUCER',
        name: input.name,
        email: input.email,
        password: passwordHash,
        phone: input.phone,
        // Pendiente (plan 0.5): completar cuando exista el catálogo de localidades
        locality: null,
        coordinates: {
          type: 'Point',
          coordinates: input.location.coordinates,
          // Necesario para que PostGIS asigne el SRID de la columna
          crs: { type: 'name', properties: { name: `EPSG:${WGS84_SRID}` } }
        }
      },
      profile: {
        businessName: input.businessName,
        category: input.category,
        address: input.location.address,
        paymentMethods: input.paymentMethods ?? [],
        deliveryOptions: input.deliveryOptions ?? [],
        bio: input.bio ?? null
      }
    };
  }

  static toUpdatePersistence(input: UpdateProducerInput): UpdateProducerPersistenceAttributes {
    const user: Partial<UserPersistenceAttributes> = {};
    const profile: Partial<ProducerProfilePersistenceAttributes> = {};

    if (input.name !== undefined) user.name = input.name;
    if (input.phone !== undefined) user.phone = input.phone;

    if (input.businessName !== undefined) profile.businessName = input.businessName;
    if (input.category !== undefined) profile.category = input.category;
    if (input.paymentMethods !== undefined) profile.paymentMethods = input.paymentMethods;
    if (input.deliveryOptions !== undefined) profile.deliveryOptions = input.deliveryOptions;
    if (input.bio !== undefined) profile.bio = input.bio;

    if (input.location !== undefined) {
      user.coordinates = {
        type: 'Point',
        coordinates: input.location.coordinates,
        crs: { type: 'name', properties: { name: `EPSG:${WGS84_SRID}` } }
      };
      profile.address = input.location.address;
    }

    const result: UpdateProducerPersistenceAttributes = {};
    if (Object.keys(user).length > 0) result.user = user;
    if (Object.keys(profile).length > 0) result.profile = profile;
    return result;
  }

  static toPublic(record: ProducerRecord, { includeEmail = false } = {}): PublicProducerProfile {
    return {
      id: record.id,
      name: record.name,
      businessName: record.producerProfile.businessName,
      category: record.producerProfile.category,
      phone: record.phone,
      ...(includeEmail && { email: record.email }),
      location: {
        address: record.producerProfile.address,
        // PostGIS devuelve también "crs" en el GeoJSON; se descarta para no filtrar detalles internos
        coordinates: { type: 'Point', coordinates: record.coordinates.coordinates }
      },
      paymentMethods: record.producerProfile.paymentMethods,
      deliveryOptions: record.producerProfile.deliveryOptions,
      bio: record.producerProfile.bio,
      createdAt: record.createdAt
    };
  }
}
