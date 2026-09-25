import { body, param, query } from 'express-validator';
import { CATEGORIES, STOCK_UNITS } from '../constants/catalog.constants.js';

export const createProductValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('El título es obligatorio')
    .isLength({ max: 120 })
    .withMessage('El título no puede superar los 120 caracteres'),

  body('description')
    .optional({ values: 'null' })
    .isString()
    .withMessage('La descripción debe ser un texto')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La descripción no puede superar los 2000 caracteres'),

  body('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`La categoría debe ser una de: ${CATEGORIES.join(', ')}`),

  body('price')
    .notEmpty()
    .withMessage('El precio es obligatorio')
    .isFloat({ gt: 0 })
    .withMessage('El precio debe ser un número mayor a 0')
    .toFloat(),

  body('offerPrice')
    .optional({ values: 'null' })
    .isFloat({ gt: 0 })
    .withMessage('El precio de oferta debe ser un número mayor a 0')
    .toFloat(),

  body('isOffer').optional().isBoolean().withMessage('isOffer debe ser un booleano').toBoolean(),

  body('stockUnit')
    .notEmpty()
    .withMessage('La unidad de stock es obligatoria')
    .isIn(STOCK_UNITS)
    .withMessage(`stockUnit debe ser una de: ${STOCK_UNITS.join(', ')}`),

  body('imageUrl')
    .optional({ values: 'null' })
    .isURL({ protocols: ['http', 'https'], require_tld: false })
    .withMessage('imageUrl debe ser una URL http/https válida')
];

export const updateProductValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El título no puede estar vacío')
    .isLength({ max: 120 })
    .withMessage('El título no puede superar los 120 caracteres'),

  body('description')
    .optional({ values: 'null' })
    .isString()
    .withMessage('La descripción debe ser un texto')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La descripción no puede superar los 2000 caracteres'),

  body('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`La categoría debe ser una de: ${CATEGORIES.join(', ')}`),

  body('price')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('El precio debe ser un número mayor a 0')
    .toFloat(),

  body('offerPrice')
    .optional({ values: 'null' })
    .isFloat({ gt: 0 })
    .withMessage('El precio de oferta debe ser un número mayor a 0')
    .toFloat(),

  body('isOffer').optional().isBoolean().withMessage('isOffer debe ser un booleano').toBoolean(),

  body('stockUnit')
    .optional()
    .isIn(STOCK_UNITS)
    .withMessage(`stockUnit debe ser una de: ${STOCK_UNITS.join(', ')}`),

  body('imageUrl')
    .optional({ values: 'null' })
    .isURL({ protocols: ['http', 'https'], require_tld: false })
    .withMessage('imageUrl debe ser una URL http/https válida'),

  body('available').optional().isBoolean().withMessage('available debe ser un booleano').toBoolean()
];

export const productIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('El id debe ser un número entero positivo').toInt()
];

// GET /api/products (HU-03)
export const searchProductsValidator = [
  query('q').optional().trim().isLength({ max: 80 }).withMessage('q no puede superar los 80 caracteres'),

  query('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`category debe ser una de: ${CATEGORIES.join(', ')}`),

  query('isOffer').optional().isBoolean().withMessage('isOffer debe ser un booleano').toBoolean(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit debe ser un entero entre 1 y 100')
    .toInt(),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset debe ser un entero mayor o igual a 0')
    .toInt(),

  // Posición del comprador (HU-04): lat y lng, si vienen, tienen que venir juntos
  query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('lat debe ser un número entre -90 y 90').toFloat(),

  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('lng debe ser un número entre -180 y 180')
    .toFloat(),

  query('maxDistance')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('maxDistance debe ser un número mayor a 0')
    .toFloat(),

  // No usan .optional() a propósito: deben correr siempre para validar la combinación de campos
  query('lat').custom((_value, { req }) => {
    const hasLat = req.query?.lat !== undefined;
    const hasLng = req.query?.lng !== undefined;
    if (hasLat !== hasLng) {
      throw new Error('lat y lng deben enviarse juntos');
    }
    return true;
  }),

  query('maxDistance').custom((value, { req }) => {
    if (value !== undefined && (req.query?.lat === undefined || req.query?.lng === undefined)) {
      throw new Error('maxDistance requiere lat y lng');
    }
    return true;
  })
];
