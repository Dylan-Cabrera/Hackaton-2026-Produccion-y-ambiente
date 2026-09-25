import {
  ProducerDemandOptions,
  ProducerDemandResponse,
  AdminAnalyticsOptions,
  AdminSummaryResponse,
  UnmetDemandMapOptions,
  UnmetDemandMapResponse
} from './analytics.types.js';

export interface IAnalyticsService {
  getProducerDemand(producerId: number, options: ProducerDemandOptions): Promise<ProducerDemandResponse>;
  getAdminSummary(options: AdminAnalyticsOptions): Promise<AdminSummaryResponse>;
  getUnmetDemandMap(options: UnmetDemandMapOptions): Promise<UnmetDemandMapResponse>;
}
