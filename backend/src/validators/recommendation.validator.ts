import { query } from 'express-validator';

export const b2bRecommendationsValidator = [
  query('radiusKm')
    .optional()
    .isFloat({ gt: 0, max: 300 })
    .withMessage('radiusKm debe ser un número mayor a 0 y hasta 300')
    .toFloat(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('limit debe ser un entero entre 1 y 30')
    .toInt()
];
