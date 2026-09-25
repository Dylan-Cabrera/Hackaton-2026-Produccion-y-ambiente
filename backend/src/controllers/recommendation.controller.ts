import { Response, NextFunction } from 'express';
import { IRecommendationService } from '../interfaces/recommendation-service.interface.js';
import { recommendationService as defaultRecommendationService } from '../config/container.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export class RecommendationController {
  constructor(private readonly recommendationService: IRecommendationService = defaultRecommendationService) {}

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
}
