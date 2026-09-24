import { WGS84_SRID } from '../constants/catalog.constants.js';
import {
  ProducerRecord,
  PublicProducerProfile,
  UpdateProducerPersistenceAttributes,
  UpdateProducerProfileInput
} from '../interfaces/producer.types.js';

// Responsabilidad única: traducir entre las distintas formas del perfil de productor
// (entrada de PUT /api/producers/profile, fila de `users` + `producer_profiles`, respuesta pública).
export class ProducerMapper {
  static toUpdatePersistence(input: UpdateProducerProfileInput): UpdateProducerPersistenceAttributes {
    const user: NonNullable<UpdateProducerPersistenceAttributes['user']> = {};
    const profile: NonNullable<UpdateProducerPersistenceAttributes['profile']> = {};

    if (input.name !== undefined) user.name = input.name;
    if (input.phone !== undefined) user.phone = input.phone;
    if (input.locality !== undefined) user.locality = input.locality;
    if (input.coordinates !== undefined) {
      user.coordinates = {
        type: 'Point',
        coordinates: input.coordinates,
        crs: { type: 'name', properties: { name: `EPSG:${WGS84_SRID}` } }
      };
    }

    if (input.businessName !== undefined) profile.businessName = input.businessName;
    if (input.category !== undefined) profile.category = input.category;
    if (input.address !== undefined) profile.address = input.address;
    if (input.paymentMethods !== undefined) profile.paymentMethods = input.paymentMethods;
    if (input.deliveryOptions !== undefined) profile.deliveryOptions = input.deliveryOptions;
    if (input.bio !== undefined) profile.bio = input.bio;

    const result: UpdateProducerPersistenceAttributes = {};
    if (Object.keys(user).length > 0) result.user = user;
    if (Object.keys(profile).length > 0) result.profile = profile;
    return result;
  }

  static toPublic(record: ProducerRecord): PublicProducerProfile {
    return {
      id: record.id,
      name: record.name,
      businessName: record.producerProfile.businessName,
      category: record.producerProfile.category,
      // El registro de un PRODUCER siempre exige phone y locality (con centroide de respaldo)
      phone: record.phone!,
      location: {
        address: record.producerProfile.address ?? '',
        coordinates: record.coordinates!
      },
      paymentMethods: record.producerProfile.paymentMethods,
      deliveryOptions: record.producerProfile.deliveryOptions,
      bio: record.producerProfile.bio,
      createdAt: record.createdAt
    };
  }
}
