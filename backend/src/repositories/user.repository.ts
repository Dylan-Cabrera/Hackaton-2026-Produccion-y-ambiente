import { User, ProducerProfile } from '../models/index.js';
import { IUserRepository } from '../interfaces/user-repository.interface.js';
import {
  CreateUserPersistenceAttributes,
  UpdateUserPersistenceAttributes,
  UserRecord
} from '../interfaces/user.types.js';
import sequelize from '../config/database.js';
import { toPlainPoint } from '../utils/geo.js';

// Única clase que conoce Sequelize/los modelos para el agregado "cuenta". El resto
// del dominio solo ve IUserRepository (DIP).
export class SequelizeUserRepository implements IUserRepository {
  // El perfil de productor es opcional: solo existe cuando role = 'PRODUCER'
  private static readonly PRODUCER_INCLUDE = {
    model: ProducerProfile,
    as: 'producerProfile',
    required: false
  };

  async create(data: CreateUserPersistenceAttributes): Promise<UserRecord> {
    const userId = await sequelize.transaction(async (transaction) => {
      const user: any = await User.create(data.user as any, { transaction });
      if (data.producerProfile) {
        await ProducerProfile.create({ userId: user.id, ...data.producerProfile } as any, { transaction });
      }
      return user.id as number;
    });

    const instance = await User.findByPk(userId, { include: [SequelizeUserRepository.PRODUCER_INCLUDE] });
    return this.toRecord(instance);
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const instance = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [SequelizeUserRepository.PRODUCER_INCLUDE]
    });
    return instance ? this.toRecord(instance) : null;
  }

  async findById(id: number): Promise<UserRecord | null> {
    const instance = await User.findByPk(id, { include: [SequelizeUserRepository.PRODUCER_INCLUDE] });
    return instance ? this.toRecord(instance) : null;
  }

  async update(id: number, data: UpdateUserPersistenceAttributes): Promise<UserRecord | null> {
    const instance: any = await User.findByPk(id, { include: [SequelizeUserRepository.PRODUCER_INCLUDE] });
    if (!instance) {
      return null;
    }

    await instance.update(data as any);
    return this.toRecord(instance);
  }

  async delete(id: number): Promise<boolean> {
    // producer_profiles (y, más adelante, products/needs) se borran en cascada por FK
    const deletedCount = await User.destroy({ where: { id } });
    return deletedCount > 0;
  }

  private toRecord(instance: any): UserRecord {
    const plain = instance.get({ plain: true });
    return {
      id: plain.id,
      role: plain.role,
      name: plain.name,
      email: plain.email,
      password: plain.password,
      phone: plain.phone,
      locality: plain.locality,
      coordinates: toPlainPoint(plain.coordinates),
      accountType: plain.accountType,
      organizationName: plain.organizationName,
      institutionType: plain.institutionType,
      createdAt: plain.createdAt,
      producerProfile: plain.producerProfile
        ? {
            businessName: plain.producerProfile.businessName,
            category: plain.producerProfile.category,
            address: plain.producerProfile.address,
            paymentMethods: plain.producerProfile.paymentMethods,
            deliveryOptions: plain.producerProfile.deliveryOptions,
            bio: plain.producerProfile.bio
          }
        : null
    };
  }
}
