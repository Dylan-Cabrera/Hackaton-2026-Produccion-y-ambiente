import { TelemetryEventPersistenceAttributes } from './telemetry.types.js';

// Abstracción de la persistencia (Dependency Inversion + Interface Segregation):
// los servicios de dominio no conocen Sequelize, solo este contrato.
export interface ITelemetryRepository {
  create(data: TelemetryEventPersistenceAttributes): Promise<void>;
}
