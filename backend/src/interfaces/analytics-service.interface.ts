import { ProducerDemandOptions, ProducerDemandResponse } from './analytics.types.js';

export interface IAnalyticsService {
  getProducerDemand(producerId: number, options: ProducerDemandOptions): Promise<ProducerDemandResponse>;
}
