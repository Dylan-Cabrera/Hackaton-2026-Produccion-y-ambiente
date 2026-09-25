import { WGS84_SRID } from '../constants/catalog.constants.js';
import { ValidationError } from '../errors/app-error.js';
import { localityCentroid } from '../utils/geo.js';
import { CoordinatesTuple, GeoJSONPoint } from '../interfaces/geo.types.js';
import { RequesterContext } from '../interfaces/need-service.interface.js';
import {
  CreateNeedInput,
  NeedAuthorSummary,
  NeedPersistenceAttributes,
  NeedWithAuthorRecord,
  PublicNeed,
  PublicNeedWithMatchCount,
  UpdateNeedInput,
  UpdateNeedPersistenceAttributes
} from '../interfaces/need.types.js';

// Datos del autor necesarios para completar los valores por defecto de una necesidad
export interface AuthorDefaults {
  locality: string | null;
  coordinates: GeoJSONPoint | null;
}

// Responsabilidad única: traducir entre las distintas formas de una necesidad
// (entrada de la API, fila de la base de datos, respuesta pública).
export class NeedMapper {
  private static readonly MIN_RADIUS_KM = 5;
  private static readonly MAX_RADIUS_KM = 200;
  private static readonly DEFAULT_RADIUS_KM = 30;

  static toCreatePersistence(
    userId: number,
    input: CreateNeedInput,
    author: AuthorDefaults
  ): NeedPersistenceAttributes {
    const locality = input.locality ?? author.locality;
    if (!locality) {
      throw new ValidationError('Necesitás cargar tu localidad en tu perfil antes de publicar una necesidad');
    }

    // Las coordenadas del autor solo sirven de default cuando la localidad no cambió;
    // si se publica para otra localidad, hay que usar el centroide de esa, no la posición propia.
    const useAuthorCoordinates = input.locality === undefined;
    const coordinates =
      input.coordinates ?? this.resolveCoordinates(locality, useAuthorCoordinates ? author.coordinates : null);
    if (!coordinates) {
      throw new ValidationError('No se pudo determinar las coordenadas de la necesidad');
    }

    return {
      userId,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      quantity: input.quantity,
      unit: input.unit,
      frequency: input.frequency ?? 'UNICA',
      locality,
      coordinates: {
        type: 'Point',
        coordinates,
        crs: { type: 'name', properties: { name: `EPSG:${WGS84_SRID}` } }
      },
      radiusKm: this.clampRadius(input.radiusKm ?? NeedMapper.DEFAULT_RADIUS_KM),
      status: 'OPEN'
    };
  }

  static toUpdatePersistence(input: UpdateNeedInput): UpdateNeedPersistenceAttributes {
    const data: UpdateNeedPersistenceAttributes = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.category !== undefined) data.category = input.category;
    if (input.quantity !== undefined) data.quantity = input.quantity;
    if (input.unit !== undefined) data.unit = input.unit;
    if (input.frequency !== undefined) data.frequency = input.frequency;
    if (input.locality !== undefined) data.locality = input.locality;
    if (input.radiusKm !== undefined) data.radiusKm = this.clampRadius(input.radiusKm);
    if (input.status !== undefined) data.status = input.status;
    if (input.coordinates !== undefined) {
      data.coordinates = {
        type: 'Point',
        coordinates: input.coordinates,
        crs: { type: 'name', properties: { name: `EPSG:${WGS84_SRID}` } }
      };
    }

    return data;
  }

  static toPublic(record: NeedWithAuthorRecord, requester: RequesterContext): PublicNeed {
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      category: record.category,
      quantity: record.quantity,
      unit: record.unit,
      frequency: record.frequency,
      locality: record.locality,
      coordinates: record.coordinates,
      radiusKm: record.radiusKm,
      status: record.status,
      createdAt: record.createdAt,
      author: NeedMapper.toAuthorSummary(record, requester),
      ...(record.distanceKm !== undefined ? { distanceKm: record.distanceKm } : {})
    };
  }

  static toPublicWithMatchCount(record: NeedWithAuthorRecord, requester: RequesterContext, matchCount: number): PublicNeedWithMatchCount {
    return { ...NeedMapper.toPublic(record, requester), matchCount };
  }

  // Teléfono visible solo para un PRODUCER o el propio autor (optionalAuth)
  private static toAuthorSummary(record: NeedWithAuthorRecord, requester: RequesterContext): NeedAuthorSummary {
    const canSeePhone = requester.role === 'PRODUCER' || requester.userId === record.author.id;

    return {
      id: record.author.id,
      displayName: record.author.organizationName ?? record.author.name,
      accountType: record.author.accountType,
      institutionType: record.author.institutionType,
      locality: record.author.locality,
      ...(canSeePhone ? { phone: record.author.phone } : {})
    };
  }

  private static resolveCoordinates(locality: string, authorCoordinates: GeoJSONPoint | null): CoordinatesTuple | null {
    if (authorCoordinates) {
      return authorCoordinates.coordinates;
    }
    const centroid = localityCentroid(locality);
    return centroid ? [centroid.lng, centroid.lat] : null;
  }

  private static clampRadius(radiusKm: number): number {
    return Math.min(Math.max(radiusKm, NeedMapper.MIN_RADIUS_KM), NeedMapper.MAX_RADIUS_KM);
  }
}
