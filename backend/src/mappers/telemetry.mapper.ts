import { WGS84_SRID, Category } from '../constants/catalog.constants.js';
import { CoordinatesTuple } from '../interfaces/geo.types.js';
import { TelemetryEventInput, TelemetryEventPersistenceAttributes } from '../interfaces/telemetry.types.js';

// Datos geográficos/de categoría ya resueltos por el servicio (centroide de localidad,
// nearestLocality, inferencia de categoría), listos para persistir.
export interface ResolvedTelemetryContext {
  category: Category | null;
  locality: string | null;
  coordinates: CoordinatesTuple | null;
}

// Responsabilidad única: traducir el body de la API + el contexto ya resuelto por el
// servicio a la forma que espera la tabla.
export class TelemetryMapper {
  static toPersistence(
    input: TelemetryEventInput,
    userId: number | null,
    resolved: ResolvedTelemetryContext
  ): TelemetryEventPersistenceAttributes {
    return {
      eventType: input.eventType,
      queryTerm: input.queryTerm ? input.queryTerm.trim().toLowerCase() : null,
      category: resolved.category,
      locality: resolved.locality,
      coordinates: resolved.coordinates
        ? {
            type: 'Point',
            coordinates: resolved.coordinates,
            crs: { type: 'name', properties: { name: `EPSG:${WGS84_SRID}` } }
          }
        : null,
      productId: input.productId ?? null,
      producerId: input.producerId ?? null,
      userId
    };
  }
}
