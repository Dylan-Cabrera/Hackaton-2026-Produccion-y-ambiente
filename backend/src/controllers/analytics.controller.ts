import { Response, NextFunction } from 'express';
import { IAnalyticsService } from '../interfaces/analytics-service.interface.js';
import { analyticsService as defaultAnalyticsService } from '../config/container.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { Category } from '../constants/catalog.constants.js';

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

  // GET /api/analytics/trends (público)
  trends = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { days } = req.query;

      const result = await this.analyticsService.getTrends({
        days: days as unknown as number | undefined
      });

      return res.status(200).json({
        message: 'Tendencias obtenidas exitosamente',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  };

  // GET /api/analytics/demand-heat (público)
  demandHeat = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { days, category } = req.query;

      const result = await this.analyticsService.getDemandHeat({
        days: days as unknown as number | undefined,
        category: category as unknown as Category | undefined
      });

      return res.status(200).json({
        message: 'Mapa de demanda obtenido exitosamente',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  };

  // GET /api/analytics/admin-summary
  adminSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { days } = req.query;

      const result = await this.analyticsService.getAdminSummary({
        days: days as unknown as number | undefined
      });

      return res.status(200).json({
        message: 'Resumen provincial obtenido exitosamente',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  };

  // GET /api/analytics/unmet-demand-map
  unmetDemandMap = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { days, category } = req.query;

      const result = await this.analyticsService.getUnmetDemandMap({
        days: days as unknown as number | undefined,
        category: category as unknown as Category | undefined
      });

      return res.status(200).json({
        message: 'Mapa de vacíos obtenido exitosamente',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  };
}
