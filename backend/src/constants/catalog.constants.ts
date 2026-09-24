// Catálogo único de rubros/categorías: lo comparten el perfil de productor,
// los productos (HU-02), la matriz B2B (HU-05) y el matching de necesidades (HU-11).
export const CATEGORIES = [
  'Frutas Frescas',
  'Verduras/Hortalizas',
  'Tubérculos/Raíces',
  'Dulces/Mermeladas',
  'Snacks/Frituras',
  'Apicultura',
  'Aceites',
  'Envases/Frascos',
  'Lácteos/Quesos',
  'Carnes/Huevos',
  'Panificados',
  'Artesanías/Textil',
  'Otros'
] as const;
export type Category = (typeof CATEGORIES)[number];

export const STOCK_UNITS = ['kg', 'atado', 'litro', 'unidad', 'caja', 'docena', 'frasco'] as const;
export type StockUnit = (typeof STOCK_UNITS)[number];

// Solo aplica a cuentas CONSUMER con accountType = 'INSTITUCION'
export const INSTITUTION_TYPES = ['Comedor', 'Escuela', 'ONG', 'Municipio', 'Comercio', 'Otro'] as const;
export type InstitutionType = (typeof INSTITUTION_TYPES)[number];

// SRID de WGS 84 (lat/lng estándar de GPS)
export const WGS84_SRID = 4326;
