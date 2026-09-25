import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { WGS84_SRID, CATEGORIES } from '../constants/catalog.constants.js';
import { EVENT_TYPES } from '../constants/telemetry.constants.js';

// Telemetría de demanda: búsquedas y clics de contacto por WhatsApp.
// Sin timestamps automáticos: usa su propia columna `timestamp` (default NOW).
const DemandMetric = sequelize.define(
  'demand_metrics',
  {
    eventType: {
      type: DataTypes.ENUM(...EVENT_TYPES),
      allowNull: false
    },
    // Se guarda con trim().toLowerCase() (ver TelemetryMapper)
    queryTerm: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM(...CATEGORIES),
      allowNull: true
    },
    locality: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    coordinates: {
      type: DataTypes.GEOMETRY('POINT', WGS84_SRID),
      allowNull: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'products', key: 'id' }
    },
    producerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    // Nunca se acepta en el body: sale del token, o queda null si es un visitante anónimo
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    // Necesidad (HU-11) relacionada con el evento, cuando aplica
    needId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'needs', key: 'id' }
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    timestamps: false,
    indexes: [
      { fields: ['eventType'] },
      { fields: ['category'] },
      { fields: ['locality'] },
      { fields: ['coordinates'], using: 'GIST' },
      { fields: ['producerId'] },
      { fields: ['userId'] },
      { fields: ['timestamp'] }
    ]
  }
);

export default DemandMetric;
