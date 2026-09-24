import { STOCK_UNITS } from '../constants/catalog.constants.js';

// Palabras que no aportan al matching de HU-10/HU-11 (artículos, preposiciones, frecuencias)
const STOPWORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'unos', 'unas',
  'y', 'o', 'u', 'a', 'al', 'en', 'con', 'sin', 'por', 'para', 'que',
  'x', 'semana', 'semanal', 'mes', 'mensual', 'dia', 'diario'
]);

const UNITS = new Set<string>(STOCK_UNITS);

// Minúsculas, sin acentos, espacios colapsados
export const normalizeTerm = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

// Palabras de 3+ letras, sin stopwords, números ni unidades de stock
export const extractKeywords = (value: string): string[] => {
  const normalized = normalizeTerm(value);

  return normalized
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3)
    .filter((word) => !/^\d+$/.test(word))
    .filter((word) => !STOPWORDS.has(word))
    .filter((word) => !UNITS.has(word));
};
