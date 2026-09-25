import { Category } from './catalog.constants.js';

// Insumos típicos que cada rubro de productor suele necesitar de otros productores (HU-05).
// No requiere migración: para agregar un rubro nuevo alcanza con sumar una entrada acá.
export const SUPPLY_MATRIX: Partial<Record<Category, Category[]>> = {
  'Snacks/Frituras': ['Tubérculos/Raíces', 'Aceites'],
  'Dulces/Mermeladas': ['Frutas Frescas', 'Envases/Frascos'],
  Apicultura: ['Envases/Frascos'],
  // Extensión sugerida (no está en el README original)
  Panificados: ['Lácteos/Quesos', 'Carnes/Huevos', 'Apicultura']
};
