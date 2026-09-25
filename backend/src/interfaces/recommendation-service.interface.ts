import { B2BRecommendationOptions, B2BRecommendationResponse } from './recommendation.types.js';

export interface IRecommendationService {
  getB2BRecommendations(producerId: number, options: B2BRecommendationOptions): Promise<B2BRecommendationResponse>;
}
