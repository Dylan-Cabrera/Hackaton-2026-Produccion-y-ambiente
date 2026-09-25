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

export const forYouValidator = [
  query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('lat debe ser un número entre -90 y 90').toFloat(),

  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('lng debe ser un número entre -180 y 180')
    .toFloat(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('limit debe ser un entero entre 1 y 30')
    .toInt(),

  // No usa .optional() a propósito: debe correr siempre para validar la combinación de campos
  query('lat').custom((_value, { req }) => {
    const hasLat = req.query?.lat !== undefined;
    const hasLng = req.query?.lng !== undefined;
    if (hasLat !== hasLng) {
      throw new Error('lat y lng deben enviarse juntos');
    }
    return true;
  })
];
