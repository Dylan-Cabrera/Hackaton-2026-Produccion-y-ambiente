export const PRODUCER_CATEGORIES = [
  'Frutihortícola',
  'Conservas/Dulces',
  'Apicultura',
  'Artesanías/Textil',
  'Otros'
] as const;

export type ProducerCategory = (typeof PRODUCER_CATEGORIES)[number];

// SRID de WGS 84 (lat/lng estándar de GPS)
export const WGS84_SRID = 4326;
