import User from './user.model.js';
import ProducerProfile from './producer-profile.model.js';
import Product from './product.model.js';
import DemandMetric from './demand-metric.model.js';
import Need from './need.model.js';

// Composition root de asociaciones: se importa una única vez, antes de sincronizar la base,
// para que Sequelize conozca las relaciones al crear las tablas y sus FKs.
User.hasOne(ProducerProfile, { foreignKey: 'userId', as: 'producerProfile', onDelete: 'CASCADE' });
ProducerProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Product, { foreignKey: 'producerId', as: 'products', onDelete: 'CASCADE' });
Product.belongsTo(User, { foreignKey: 'producerId', as: 'producer' });

User.hasMany(Need, { foreignKey: 'userId', as: 'needs', onDelete: 'CASCADE' });
Need.belongsTo(User, { foreignKey: 'userId', as: 'author' });

DemandMetric.belongsTo(Product, { foreignKey: 'productId', as: 'product', onDelete: 'SET NULL' });
DemandMetric.belongsTo(User, { foreignKey: 'producerId', as: 'producer', onDelete: 'SET NULL' });
DemandMetric.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'SET NULL' });
DemandMetric.belongsTo(Need, { foreignKey: 'needId', as: 'need', onDelete: 'SET NULL' });

export { User, ProducerProfile, Product, DemandMetric, Need };
