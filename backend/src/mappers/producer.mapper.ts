import { WGS84_SRID } from '../constants/producer.constants.js';
import {
  CreateProducerInput,
  ProducerPersistenceAttributes,
  ProducerRecord,
  PublicProducerProfile
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
