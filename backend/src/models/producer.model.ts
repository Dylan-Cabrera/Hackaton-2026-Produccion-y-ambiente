import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { PRODUCER_CATEGORIES, WGS84_SRID } from '../constants/producer.constants.js';

const Producer = sequelize.define(
  'producers',
  {
    // Nombre y apellido o referente
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    // Nombre comercial o de la chacra/emprendimiento
    businessName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM(...PRODUCER_CATEGORIES),
      allowNull: false
    },
    // Número normalizado con código de área para WhatsApp (ej: 549370...)
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
      set(this: any, value: string) {
        this.setDataValue('email', String(value).trim().toLowerCase());
      }
    },
    // Hash bcrypt
    password: {
      type: DataTypes.STRING(225),
      allowNull: false
    },
    // location.address: dirección o referencia de barrio/colonia
    address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    // location.coordinates: GeoJSON Point [longitude, latitude]
    coordinates: {
      type: DataTypes.GEOMETRY('POINT', WGS84_SRID),
      allowNull: false
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
    timestamps: true,
    updatedAt: false, // El schema solo requiere createdAt
    indexes: [
      // Índice espacial para consultas por cercanía (equivalente a 2dsphere en PostGIS)
      { fields: ['coordinates'], using: 'GIST' }
    ]
  }
);

export default Producer;
