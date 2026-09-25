// Query params de GET /api/analytics/producer-demand
export interface ProducerDemandOptions {
  days?: number;
}

export interface ClicksByLocality {
  locality: string;
  clicks: number;
}

export interface TopTerm {
  term: string;
  count: number;
  fails: number;
}

export interface ProducerDemandTotals {
  whatsappClicks: number;
  relatedSearches: number;
  relatedFails: number;
  // Pendiente (HU-11): necesidades OPEN que el productor podría cubrir
  openNeedsNearby: number;
}

export interface ProducerDemandResponse {
  days: number;
  totals: ProducerDemandTotals;
  clicksByLocality: ClicksByLocality[];
  topTerms: TopTerm[];
}
