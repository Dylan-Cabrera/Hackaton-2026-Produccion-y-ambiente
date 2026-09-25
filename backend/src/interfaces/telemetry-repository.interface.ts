import { TelemetryEventPersistenceAttributes, UserTelemetryEvent } from './telemetry.types.js';

// Abstracción de la persistencia (Dependency Inversion + Interface Segregation):
// los servicios de dominio no conocen Sequelize, solo este contrato.
export interface ITelemetryRepository {
  create(data: TelemetryEventPersistenceAttributes): Promise<void>;
  // Historial propio del usuario (HU-10): nunca expone eventos de otros
  findByUser(userId: number, since: Date): Promise<UserTelemetryEvent[]>;
  // Privacidad (HU-10): desvincula al usuario de sus eventos sin borrar la telemetría agregada
  clearUserActivity(userId: number): Promise<void>;
}
