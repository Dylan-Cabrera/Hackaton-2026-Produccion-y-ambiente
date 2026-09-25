import { Category } from '../constants/catalog.constants.js';

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
  productViews: number;
  whatsappClicks: number;
  relatedSearches: number;
  relatedFails: number;
  // Pendiente (HU-11): necesidades OPEN que el productor podría cubrir
  openNeedsNearby: number;
}

// Un registro por día del período (incluidos los días sin actividad), fecha en hora argentina
export interface DailyActivity {
  date: string; // YYYY-MM-DD
  views: number;
  clicks: number;
}

// Todos los productos del productor (incluidos los pausados) con su actividad del período
export interface ProductPerformance {
  productId: number;
  title: string;
  available: boolean;
  views: number;
  clicks: number;
}

// Suma ponderada de eventos de demanda en una localidad (un contacto por WhatsApp pesa 3;
// una búsqueda o una visita, 1)
export interface LocalityDemand {
  locality: string;
  events: number;
}

export interface ProducerDemandResponse {
  days: number;
  totals: ProducerDemandTotals;
  clicksByLocality: ClicksByLocality[];
  topTerms: TopTerm[];
  dailyActivity: DailyActivity[];
  productPerformance: ProductPerformance[];
  demandHeat: HeatCell[];
  demandByLocality: LocalityDemand[];
}

// Query params de GET /api/analytics/demand-heat (mapa de demanda público)
export interface DemandHeatOptions {
  days?: number;
  category?: Category;
}

export interface DemandHeatResponse {
  heat: HeatCell[];
  byLocality: LocalityDemand[];
}

// Query params compartidos por los dos endpoints de HU-08 (dashboard admin)
export interface AdminAnalyticsOptions {
  days?: number;
}

export interface AdminSummaryTotals {
  producers: number;
  consumers: number;
  institutions: number;
  activeProducts: number;
  activeOffers: number;
  searches: number;
  searchFailRate: number;
  whatsappClicks: number;
  // Pendiente (HU-11): necesidades publicadas
  openNeeds: number;
  needsWithoutMatch: number;
}

export interface ProducersByCategory {
  category: Category;
  count: number;
}

export interface TopCategory {
  category: Category;
  searches: number;
}

export interface AdminSummaryResponse {
  totals: AdminSummaryTotals;
  producersByCategory: ProducersByCategory[];
  topCategories: TopCategory[];
  topTerms: TopTerm[];
}

// GET /api/analytics/unmet-demand-map: además de `days`, filtra por categoría
export interface UnmetDemandMapOptions extends AdminAnalyticsOptions {
  category?: Category;
}

export interface SupplyPoint {
  id: number;
  businessName: string;
  category: Category;
  locality: string | null;
  lat: number;
  lng: number;
}

// [lat, lng, peso]
export type HeatCell = [number, number, number];

// Pendiente (HU-11): necesidad OPEN sin matches
export interface UnmetNeed {
  id: number;
  title: string;
  category: Category;
  quantity: number;
  unit: string;
  frequency: string;
  locality: string;
  lat: number;
  lng: number;
  authorType: string;
}

export interface Opportunity {
  locality: string;
  fails: number;
  unmetNeeds: number;
  topTerms: string[];
  producers: number;
}

export interface UnmetDemandMapResponse {
  supply: SupplyPoint[];
  unmetHeat: HeatCell[];
  unmetNeeds: UnmetNeed[];
  opportunities: Opportunity[];
}
