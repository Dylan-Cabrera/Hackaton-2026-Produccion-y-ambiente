import sequelize from '../config/database.js';
import { User, ProducerProfile } from '../models/index.js';
import { IProducerRepository } from '../interfaces/producer-repository.interface.js';
import {
  ProducerPersistenceAttributes,
  ProducerRecord,
  UpdateProducerPersistenceAttributes
} from '../interfaces/producer.types.js';

// Única clase que conoce Sequelize/los modelos. El resto del dominio solo ve IProducerRepository (DIP).
export class SequelizeProducerRepository implements IProducerRepository {
  // Solo trae usuarios que además tengan perfil de productor (inner join)
  private static readonly PRODUCER_INCLUDE = {
    model: ProducerProfile,
    as: 'producerProfile',
    required: true
  };

  async create(data: ProducerPersistenceAttributes): Promise<ProducerRecord> {
    const userId = await sequelize.transaction(async (transaction) => {
      const user: any = await User.create(data.user as any, { transaction });
      await ProducerProfile.create({ userId: user.id, ...data.profile } as any, { transaction });
      return user.id as number;
    });

    const instance = await User.findByPk(userId, { include: [SequelizeProducerRepository.PRODUCER_INCLUDE] });
    return this.toRecord(instance);
  }

  async findByEmail(email: string): Promise<ProducerRecord | null> {
    const instance = await User.findOne({
      where: { email: email.toLowerCase(), role: 'PRODUCER' },
      include: [SequelizeProducerRepository.PRODUCER_INCLUDE]
    });
    return instance ? this.toRecord(instance) : null;
  }

  async findById(id: number): Promise<ProducerRecord | null> {
    const instance = await User.findOne({
      where: { id, role: 'PRODUCER' },
      include: [SequelizeProducerRepository.PRODUCER_INCLUDE]
    });
    return instance ? this.toRecord(instance) : null;
  }

  async update(id: number, data: UpdateProducerPersistenceAttributes): Promise<ProducerRecord | null> {
    const instance: any = await User.findOne({
      where: { id, role: 'PRODUCER' },
      include: [SequelizeProducerRepository.PRODUCER_INCLUDE]
    });
    if (!instance) {
      return null;
    }

    await sequelize.transaction(async (transaction) => {
      if (data.user) {
        await instance.update(data.user, { transaction });
      }
      if (data.profile) {
        await instance.producerProfile.update(data.profile, { transaction });
      }
    });

    await instance.reload();
    return this.toRecord(instance);
  }

  async delete(id: number): Promise<boolean> {
    // ProducerProfile se borra en cascada por la FK definida en models/index.ts
    const deletedCount = await User.destroy({ where: { id, role: 'PRODUCER' } });
    return deletedCount > 0;
  }

  // Aplana el resultado del include (`users` + `producer_profiles`) a la forma que usa el dominio
  private toRecord(instance: any): ProducerRecord {
    const plain = instance.get({ plain: true });
    return {
      id: plain.id,
      name: plain.name,
      email: plain.email,
      password: plain.password,
      phone: plain.phone,
      coordinates: plain.coordinates,
      createdAt: plain.createdAt,
      producerProfile: {
        businessName: plain.producerProfile.businessName,
        category: plain.producerProfile.category,
        address: plain.producerProfile.address,
        paymentMethods: plain.producerProfile.paymentMethods,
        deliveryOptions: plain.producerProfile.deliveryOptions,
        bio: plain.producerProfile.bio
      }
    };
  }
}
