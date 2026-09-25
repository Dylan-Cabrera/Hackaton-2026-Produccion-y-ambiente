import { Category } from '../constants/catalog.constants.js';
import { EventType } from '../constants/telemetry.constants.js';
import { GeoJSONPoint } from './geo.types.js';

// Body de POST /api/telemetry/event
export interface TelemetryEventInput {
  eventType: EventType;
  queryTerm?: string;
  category?: Category;
  locality?: string;
  lat?: number;
  lng?: number;
  productId?: number;
  producerId?: number;
}

export interface TelemetryEventPersistenceAttributes {
  eventType: EventType;
  queryTerm: string | null;
  category: Category | null;
  locality: string | null;
  coordinates: (GeoJSONPoint & { crs?: unknown }) | null;
  productId: number | null;
  producerId: number | null;
  userId: number | null;
}

// Evento propio tal como lo necesita el algoritmo de HU-10 (sin datos de otros usuarios)
export interface UserTelemetryEvent {
  eventType: EventType;
  queryTerm: string | null;
  category: Category | null;
  timestamp: Date;
}
