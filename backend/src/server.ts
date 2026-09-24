import 'dotenv/config';
import { connectDatabase } from './config/database.js';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3000);

const startServer = async () => {
  // 1. Conectar a PostgreSQL y sincronizar tablas
  await connectDatabase();

  // 2. Crear la aplicación de Express
  const app = createApp();

  // 3. Poner el servidor a escuchar peticiones
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Auth endpoints en http://localhost:${PORT}/api/auth`);
  });
};

startServer();
