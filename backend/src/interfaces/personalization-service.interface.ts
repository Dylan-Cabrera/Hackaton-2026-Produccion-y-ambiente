import { ForYouOptions, ForYouResponse } from './personalization.types.js';

export interface IPersonalizationService {
  getForYou(userId: number, options: ForYouOptions): Promise<ForYouResponse>;
}
