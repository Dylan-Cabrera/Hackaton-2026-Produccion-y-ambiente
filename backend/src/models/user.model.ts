import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { WGS84_SRID } from '../constants/producer.constants.js';
import { ROLES, ACCOUNT_TYPES, INSTITUTION_TYPES } from '../constants/user.constants.js';

// Datos de cuenta comunes a los tres roles (CONSUMER, PRODUCER, ADMIN).
// El perfil de emprendimiento vive aparte, en `producer_profiles` (ver models/index.ts).
const User = sequelize.define(
  'users',
  {
    role: {
      type: DataTypes.ENUM(...ROLES),
      allowNull: false
    },
    // Nombre de la persona o del referente de la institución
    name: {
      type: DataTypes.STRING(100),
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
      type: DataTypes.STRING(255),
      allowNull: false
    },
    // Obligatorio para PRODUCER y para publicar necesidades (HU-11)
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    // Pendiente: validar contra el catálogo de localidades (plan 0.5, todavía no implementado)
    locality: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    coordinates: {
      type: DataTypes.GEOMETRY('POINT', WGS84_SRID),
      allowNull: true
    },
    // Los siguientes tres campos solo aplican a role = 'CONSUMER'
    accountType: {
      type: DataTypes.ENUM(...ACCOUNT_TYPES),
      allowNull: true
    },
    organizationName: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    institutionType: {
      type: DataTypes.ENUM(...INSTITUTION_TYPES),
      allowNull: true
    }
  },
  {
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ['role'] }, { fields: ['coordinates'], using: 'GIST' }]
  }
);

export default User;
