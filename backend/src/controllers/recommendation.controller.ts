import { Response, NextFunction } from 'express';
import { IRecommendationService } from '../interfaces/recommendation-service.interface.js';
import { IPersonalizationService } from '../interfaces/personalization-service.interface.js';
import {
  recommendationService as defaultRecommendationService,
  personalizationService as defaultPersonalizationService
} from '../config/container.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export class RecommendationController {
  constructor(
    private readonly recommendationService: IRecommendationService = defaultRecommendationService,
    private readonly personalizationService: IPersonalizationService = defaultPersonalizationService
  ) {}

  // GET /api/recommendations/b2b
  b2b = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { radiusKm, limit } = req.query;

      const result = await this.recommendationService.getB2BRecommendations(req.user!.id, {
        radiusKm: radiusKm as unknown as number | undefined,
        limit: limit as unknown as number | undefined
      });

      return res.status(200).json({
        message: 'Recomendaciones B2B obtenidas exitosamente',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  };

  // GET /api/recommendations/for-you
  forYou = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { lat, lng, limit } = req.query;

      const result = await this.personalizationService.getForYou(req.user!.id, {
        lat: lat as unknown as number | undefined,
        lng: lng as unknown as number | undefined,
        limit: limit as unknown as number | undefined
      });

      return res.status(200).json({
        message: 'Recomendaciones obtenidas exitosamente',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  };
}
