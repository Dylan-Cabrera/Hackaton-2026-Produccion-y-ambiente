import sequelize from '../config/database.js';
import { User, ProducerProfile } from '../models/index.js';
import { IProducerRepository } from '../interfaces/producer-repository.interface.js';
import { ProducerRecord, UpdateProducerPersistenceAttributes } from '../interfaces/producer.types.js';
import { toPlainPoint } from '../utils/geo.js';

// Única clase que conoce Sequelize/los modelos. El resto del dominio solo ve IProducerRepository (DIP).
// El alta y la baja de la cuenta viven en SequelizeUserRepository (aplican a cualquier rol).
export class SequelizeProducerRepository implements IProducerRepository {
  // Solo trae usuarios que además tengan perfil de productor (inner join)
  private static readonly PRODUCER_INCLUDE = {
    model: ProducerProfile,
    as: 'producerProfile',
    required: true
  };

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

  // Aplana el resultado del include (`users` + `producer_profiles`) a la forma que usa el dominio
  private toRecord(instance: any): ProducerRecord {
    const plain = instance.get({ plain: true });
    return {
      id: plain.id,
      name: plain.name,
      phone: plain.phone,
      coordinates: toPlainPoint(plain.coordinates),
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
