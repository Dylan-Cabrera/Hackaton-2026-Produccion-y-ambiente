import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { WGS84_SRID, CATEGORIES, STOCK_UNITS, NEED_FREQUENCIES, NEED_STATUSES } from '../constants/catalog.constants.js';

// Necesidad publicada por cualquier rol (HU-11): lo que un productor, persona o institución
// necesita comprar/conseguir. Complementa a HU-05, que infiere insumos a partir de la matriz.
const Need = sequelize.define(
  'needs',
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    title: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM(...CATEGORIES),
      allowNull: false
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    unit: {
      type: DataTypes.ENUM(...STOCK_UNITS),
      allowNull: false
    },
    frequency: {
      type: DataTypes.ENUM(...NEED_FREQUENCIES),
      allowNull: false,
      defaultValue: 'UNICA'
    },
    // Por defecto, la del usuario que publica (ver NeedMapper)
    locality: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    // Por defecto, las coordenadas del usuario o el centroide de su localidad
    coordinates: {
      type: DataTypes.GEOMETRY('POINT', WGS84_SRID),
      allowNull: false
    },
    radiusKm: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30
    },
    status: {
      type: DataTypes.ENUM(...NEED_STATUSES),
      allowNull: false,
      defaultValue: 'OPEN'
    }
  },
  {
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['category'] },
      { fields: ['status'] },
      { fields: ['coordinates'], using: 'GIST' }
    ]
  }
);

export default Need;
