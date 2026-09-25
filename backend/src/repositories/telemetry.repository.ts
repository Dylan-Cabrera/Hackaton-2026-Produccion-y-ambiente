import { Op } from 'sequelize';
import { DemandMetric } from '../models/index.js';
import { ITelemetryRepository } from '../interfaces/telemetry-repository.interface.js';
import { TelemetryEventPersistenceAttributes, UserTelemetryEvent } from '../interfaces/telemetry.types.js';

// Única clase que conoce Sequelize/el modelo. El resto del dominio solo ve ITelemetryRepository (DIP).
export class SequelizeTelemetryRepository implements ITelemetryRepository {
  async create(data: TelemetryEventPersistenceAttributes): Promise<void> {
    await DemandMetric.create(data as any);
  }

  async findByUser(userId: number, since: Date): Promise<UserTelemetryEvent[]> {
    const instances = await DemandMetric.findAll({
      where: { userId, timestamp: { [Op.gte]: since } },
      attributes: ['eventType', 'queryTerm', 'category', 'timestamp'],
      order: [['timestamp', 'DESC']]
    });

    return instances.map((instance) => {
      const plain = instance.get({ plain: true }) as any;
      return {
        eventType: plain.eventType,
        queryTerm: plain.queryTerm,
        category: plain.category,
        timestamp: plain.timestamp
      };
    });
  }

  async clearUserActivity(userId: number): Promise<void> {
    await DemandMetric.update({ userId: null }, { where: { userId } });
  }
}
