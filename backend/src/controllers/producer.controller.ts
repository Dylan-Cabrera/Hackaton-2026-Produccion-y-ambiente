import { Request, Response, NextFunction } from 'express';
import { IProducerService } from '../interfaces/producer-service.interface.js';
import { producerService as defaultProducerService } from '../config/container.js';
import { getCookieOptions } from '../utils/cookie-options.js';
import { AppError } from '../errors/app-error.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export class ProducerController {
  constructor(private readonly producerService: IProducerService = defaultProducerService) {}

  // Registro: crea el productor e inicia sesión
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { producer, token } = await this.producerService.register(req.body);

      // Guarda el token en una cookie HTTP-Only segura
      res.cookie('token', token, getCookieOptions());

      return res.status(201).json({
        message: 'Productor registrado exitosamente',
        data: { producer, token }
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const producer = await this.producerService.getPublicById(Number(req.params.id));

      return res.status(200).json({
        message: 'Productor obtenido exitosamente',
        data: producer
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const updatedProducer = await this.producerService.update(
        Number(req.params.id),
        req.user!.id,
        req.body
      );

      return res.status(200).json({
        message: 'Productor actualizado exitosamente',
        data: updatedProducer
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return next(error);
    }
  };

  remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const producerId = Number(req.params.id);
      await this.producerService.remove(producerId, req.user!.id);

      res.clearCookie('token', getCookieOptions());

      return res.status(200).json({
        message: 'Productor eliminado exitosamente'
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return next(error);
    }
  };
}
