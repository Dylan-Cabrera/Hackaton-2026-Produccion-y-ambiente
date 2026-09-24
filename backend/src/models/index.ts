import User from './user.model.js';
import ProducerProfile from './producer-profile.model.js';

// Composition root de asociaciones: se importa una única vez, antes de sincronizar la base,
// para que Sequelize conozca las relaciones al crear las tablas y sus FKs.
User.hasOne(ProducerProfile, { foreignKey: 'userId', as: 'producerProfile', onDelete: 'CASCADE' });
ProducerProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { User, ProducerProfile };
