import { body, param } from 'express-validator';
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
    .isURL({ protocols: ['http', 'https'] })
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
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('imageUrl debe ser una URL http/https válida'),

  body('available').optional().isBoolean().withMessage('available debe ser un booleano').toBoolean()
];

export const productIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('El id debe ser un número entero positivo').toInt()
];
