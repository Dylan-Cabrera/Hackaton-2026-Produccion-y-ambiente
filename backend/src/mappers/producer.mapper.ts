import { WGS84_SRID } from '../constants/producer.constants.js';
import {
  CreateProducerInput,
  ProducerPersistenceAttributes,
  ProducerRecord,
  PublicProducerProfile,
  UpdateProducerInput
} from '../interfaces/producer.types.js';

// Responsabilidad única: traducir entre las distintas formas de un productor
// (entrada de la API, fila de la base de datos, respuesta pública).
export class ProducerMapper {
  static toPersistence(input: CreateProducerInput, passwordHash: string): ProducerPersistenceAttributes {
    return {
      name: input.name,
      businessName: input.businessName,
      category: input.category,
      phone: input.phone,
      email: input.email,
      password: passwordHash,
      address: input.location.address,
      coordinates: {
        type: 'Point',
        coordinates: input.location.coordinates,
        // Necesario para que PostGIS asigne el SRID de la columna
        crs: { type: 'name', properties: { name: `EPSG:${WGS84_SRID}` } }
      },
      paymentMethods: input.paymentMethods ?? [],
      deliveryOptions: input.deliveryOptions ?? [],
      bio: input.bio ?? null
    };
  }

  static toUpdatePersistence(input: UpdateProducerInput): Partial<ProducerPersistenceAttributes> {
    const data: Partial<ProducerPersistenceAttributes> = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.businessName !== undefined) data.businessName = input.businessName;
    if (input.category !== undefined) data.category = input.category;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.paymentMethods !== undefined) data.paymentMethods = input.paymentMethods;
    if (input.deliveryOptions !== undefined) data.deliveryOptions = input.deliveryOptions;
    if (input.bio !== undefined) data.bio = input.bio;

    if (input.location !== undefined) {
      data.address = input.location.address;
      data.coordinates = {
        type: 'Point',
        coordinates: input.location.coordinates,
        crs: { type: 'name', properties: { name: `EPSG:${WGS84_SRID}` } }
      };
    }

    return data;
  }

  static toPublic(record: ProducerRecord, { includeEmail = false } = {}): PublicProducerProfile {
    return {
      id: record.id,
      name: record.name,
      businessName: record.businessName,
      category: record.category,
      phone: record.phone,
      ...(includeEmail && { email: record.email }),
      location: {
        address: record.address,
        // PostGIS devuelve también "crs" en el GeoJSON; se descarta para no filtrar detalles internos
        coordinates: { type: 'Point', coordinates: record.coordinates.coordinates }
      },
      paymentMethods: record.paymentMethods,
      deliveryOptions: record.deliveryOptions,
      bio: record.bio,
      createdAt: record.createdAt
    };
  }
}
