import { Response, NextFunction } from 'express';
import { IAnalyticsService } from '../interfaces/analytics-service.interface.js';
import { analyticsService as defaultAnalyticsService } from '../config/container.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export class AnalyticsController {
  constructor(private readonly analyticsService: IAnalyticsService = defaultAnalyticsService) {}

  // GET /api/analytics/producer-demand
  producerDemand = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { days } = req.query;

      const result = await this.analyticsService.getProducerDemand(req.user!.id, {
        days: days as unknown as number | undefined
      });

      return res.status(200).json({
        message: 'Demanda del productor obtenida exitosamente',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  };
}
