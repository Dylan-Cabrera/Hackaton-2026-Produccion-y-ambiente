import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { CATEGORIES, STOCK_UNITS } from '../constants/catalog.constants.js';

// Publicación de un productor: producto normal u oferta de excedente.
const Product = sequelize.define(
  'products',
  {
    producerId: {
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
    // Si no se envía, el servicio toma el rubro del productor
    category: {
      type: DataTypes.ENUM(...CATEGORIES),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    // Obligatorio cuando isOffer = true (regla validada en el servicio)
    offerPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    isOffer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    stockUnit: {
      type: DataTypes.ENUM(...STOCK_UNITS),
      allowNull: false
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ['producerId'] }, { fields: ['isOffer'] }, { fields: ['available'] }]
  }
);

export default Product;
