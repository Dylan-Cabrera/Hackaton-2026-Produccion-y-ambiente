import Producer from '../models/producer.model.js';
import { IProducerRepository } from '../interfaces/producer-repository.interface.js';
import { ProducerPersistenceAttributes, ProducerRecord } from '../interfaces/producer.types.js';

// Única clase que conoce Sequelize/el modelo. El resto del dominio solo ve IProducerRepository.
export class SequelizeProducerRepository implements IProducerRepository {
  async create(data: ProducerPersistenceAttributes): Promise<ProducerRecord> {
    const instance = await Producer.create(data as any);
    return instance.get({ plain: true }) as ProducerRecord;
  }

  async findByEmail(email: string): Promise<ProducerRecord | null> {
    const instance: any = await Producer.findOne({ where: { email: email.toLowerCase() } });
    return instance ? (instance.get({ plain: true }) as ProducerRecord) : null;
  }

  async findById(id: number): Promise<ProducerRecord | null> {
    const instance: any = await Producer.findByPk(id);
    return instance ? (instance.get({ plain: true }) as ProducerRecord) : null;
  }

  async update(id: number, data: Partial<ProducerPersistenceAttributes>): Promise<ProducerRecord | null> {
    const instance: any = await Producer.findByPk(id);
    if (!instance) {
      return null;
    }
    await instance.update(data as any);
    return instance.get({ plain: true }) as ProducerRecord;
  }

  async delete(id: number): Promise<boolean> {
    const deletedCount = await Producer.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
