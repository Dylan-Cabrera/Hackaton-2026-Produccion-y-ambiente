import {
  ProducerDemandOptions,
  ProducerDemandResponse,
  AdminAnalyticsOptions,
  AdminSummaryResponse,
  UnmetDemandMapOptions,
  UnmetDemandMapResponse,
  DemandHeatOptions,
  DemandHeatResponse,
  TrendsOptions,
  TrendsResponse
} from './analytics.types.js';

export interface IAnalyticsService {
  getDemandHeat(options: DemandHeatOptions): Promise<DemandHeatResponse>;
  getProducerDemand(producerId: number, options: ProducerDemandOptions): Promise<ProducerDemandResponse>;
  getAdminSummary(options: AdminAnalyticsOptions): Promise<AdminSummaryResponse>;
  getUnmetDemandMap(options: UnmetDemandMapOptions): Promise<UnmetDemandMapResponse>;
  getTrends(options: TrendsOptions): Promise<TrendsResponse>;
}
