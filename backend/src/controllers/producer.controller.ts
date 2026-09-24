import { Request, Response, NextFunction } from 'express';
import { IProducerService } from '../interfaces/producer-service.interface.js';
import { producerService as defaultProducerService } from '../config/container.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export class ProducerController {
  constructor(private readonly producerService: IProducerService = defaultProducerService) {}

  // Perfil público del emprendimiento
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const producer = await this.producerService.getPublicById(Number(req.params.id));

      return res.status(200).json({
        message: 'Productor obtenido exitosamente',
        data: producer
      });
    } catch (error) {
      return next(error);
    }
  };

  // Edita el propio perfil de emprendimiento (PUT /api/producers/profile)
  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const producer = await this.producerService.updateProfile(req.user!.id, req.body);

      return res.status(200).json({
        message: 'Perfil de productor actualizado exitosamente',
        data: producer
      });
    } catch (error) {
      return next(error);
    }
  };
}
