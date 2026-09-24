import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { CATEGORIES } from '../constants/catalog.constants.js';

// Datos del emprendimiento. Relación 1 a 1 con `users`: PK = FK = userId (ver models/index.ts).
const ProducerProfile = sequelize.define(
  'producer_profiles',
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: 'users', key: 'id' }
    },
    // Nombre comercial o de la chacra/emprendimiento
    businessName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM(...CATEGORIES),
      allowNull: false
    },
    // Dirección o referencia de barrio/colonia para la entrega
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    paymentMethods: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    },
    deliveryOptions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    timestamps: false
  }
);

export default ProducerProfile;
