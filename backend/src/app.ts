import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import producerRoutes from './routes/producer.routes.js';
import productRoutes from './routes/product.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import telemetryRoutes from './routes/telemetry.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import needRoutes from './routes/need.routes.js';
import metaRoutes from './routes/meta.routes.js';
import { errorHandler } from './middlewares/error-handler.js';

export const createApp = () => {
  const app = express();

  // Configuración de CORS para permitir cookies cruzadas desde el frontend (Vite/React)
  const allowedOrigin = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true // Permite envío y recepción de cookies
    })
  );

  // Middlewares globales
  app.use(express.json());
  app.use(cookieParser()); // Habilita lectura de req.cookies

  // Endpoint de verificación / salud del servidor
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      message: 'Servidor funcionando correctamente',
      timestamp: new Date()
    });
  });

  // Rutas de autenticación
  app.use('/api/auth', authRoutes);

  // Datos de cuenta propios (cualquier rol)
  app.use('/api/users', userRoutes);

  // Rutas de productores
  app.use('/api/producers', producerRoutes);

  // Rutas de productos
  app.use('/api/products', productRoutes);

  // Recomendaciones
  app.use('/api/recommendations', recommendationRoutes);

  // Telemetría de demanda
  app.use('/api/telemetry', telemetryRoutes);

  // Analítica
  app.use('/api/analytics', analyticsRoutes);

  // Necesidades y matching (HU-11)
  app.use('/api/needs', needRoutes);

  // Catálogos estáticos para el frontend
  app.use('/api/meta', metaRoutes);

  // Manejo de errores centralizado
  app.use(errorHandler);

  return app;
};
