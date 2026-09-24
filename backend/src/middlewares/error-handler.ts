import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Red de seguridad por si algún AppError se escapó sin ser capturado en el controlador
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error('Error no controlado:', err);
  return res.status(500).json({ message: 'Error interno del servidor' });
};
