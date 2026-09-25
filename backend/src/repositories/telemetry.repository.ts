import { DemandMetric } from '../models/index.js';
import { ITelemetryRepository } from '../interfaces/telemetry-repository.interface.js';
import { TelemetryEventPersistenceAttributes } from '../interfaces/telemetry.types.js';

// Única clase que conoce Sequelize/el modelo. El resto del dominio solo ve ITelemetryRepository (DIP).
export class SequelizeTelemetryRepository implements ITelemetryRepository {
  async create(data: TelemetryEventPersistenceAttributes): Promise<void> {
    await DemandMetric.create(data as any);
  }
}
