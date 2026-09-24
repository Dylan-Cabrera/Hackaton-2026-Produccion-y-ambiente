import { Sequelize } from 'sequelize';
import 'dotenv/config';

const dbName = process.env.DB_NAME ?? 'auth_db';
const dbUser = process.env.DB_USER ?? 'postgres';
const dbPassword = process.env.DB_PASSWORD ?? 'postgres';
const dbHost = process.env.DB_HOST ?? 'localhost';
const dbPort = Number(process.env.DB_PORT ?? 5432);

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: false
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL conectado exitosamente con Sequelize');

    // Habilita PostGIS para columnas GEOMETRY e índices espaciales
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');

    // Habilita búsquedas de texto que ignoran acentos (ej: "mandioca" encuentra "Mandióca")
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS unaccent;');

    // Sincroniza los modelos con la base de datos (crea las tablas automáticamente)
    await sequelize.sync();
    console.log('Tablas sincronizadas con la base de datos');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    process.exit(1);
  }
};

export default sequelize;
