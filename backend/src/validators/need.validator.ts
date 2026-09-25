import { body, param, query } from 'express-validator';
import { CATEGORIES, STOCK_UNITS, NEED_FREQUENCIES, NEED_STATUSES } from '../constants/catalog.constants.js';
import { LOCALITY_NAMES } from '../constants/localities.constants.js';
import { coordinatesValidator } from './common.validators.js';

export const createNeedValidator = [
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
    .notEmpty()
    .withMessage('La categoría es obligatoria')
    .isIn(CATEGORIES)
    .withMessage(`category debe ser una de: ${CATEGORIES.join(', ')}`),

  body('quantity')
    .notEmpty()
    .withMessage('La cantidad es obligatoria')
    .isFloat({ gt: 0 })
    .withMessage('La cantidad debe ser un número mayor a 0')
    .toFloat(),

  body('unit')
    .notEmpty()
    .withMessage('La unidad es obligatoria')
    .isIn(STOCK_UNITS)
    .withMessage(`unit debe ser una de: ${STOCK_UNITS.join(', ')}`),

  body('frequency')
    .optional()
    .isIn(NEED_FREQUENCIES)
    .withMessage(`frequency debe ser una de: ${NEED_FREQUENCIES.join(', ')}`),

  body('locality')
    .optional()
    .isIn(LOCALITY_NAMES)
    .withMessage(`locality debe ser una de: ${LOCALITY_NAMES.join(', ')}`),

  coordinatesValidator('coordinates'),

  body('radiusKm')
    .optional()
    .isInt({ min: 5, max: 200 })
    .withMessage('radiusKm debe ser un entero entre 5 y 200')
    .toInt()
];

export const updateNeedValidator = [
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
    .withMessage(`category debe ser una de: ${CATEGORIES.join(', ')}`),

  body('quantity')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('La cantidad debe ser un número mayor a 0')
    .toFloat(),

  body('unit')
    .optional()
    .isIn(STOCK_UNITS)
    .withMessage(`unit debe ser una de: ${STOCK_UNITS.join(', ')}`),

  body('frequency')
    .optional()
    .isIn(NEED_FREQUENCIES)
    .withMessage(`frequency debe ser una de: ${NEED_FREQUENCIES.join(', ')}`),

  body('locality')
    .optional()
    .isIn(LOCALITY_NAMES)
    .withMessage(`locality debe ser una de: ${LOCALITY_NAMES.join(', ')}`),

  coordinatesValidator('coordinates'),

  body('radiusKm')
    .optional()
    .isInt({ min: 5, max: 200 })
    .withMessage('radiusKm debe ser un entero entre 5 y 200')
    .toInt(),

  body('status').optional().isIn(NEED_STATUSES).withMessage(`status debe ser uno de: ${NEED_STATUSES.join(', ')}`)
];

export const needIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('El id debe ser un número entero positivo').toInt()
];

export const searchNeedsValidator = [
  query('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`category debe ser una de: ${CATEGORIES.join(', ')}`),

  query('locality')
    .optional()
    .isIn(LOCALITY_NAMES)
    .withMessage(`locality debe ser una de: ${LOCALITY_NAMES.join(', ')}`),

  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe ser un entero entre 1 y 100').toInt(),

  query('offset').optional().isInt({ min: 0 }).withMessage('offset debe ser un entero mayor o igual a 0').toInt(),

  query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('lat debe ser un número entre -90 y 90').toFloat(),

  query('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('lng debe ser un número entre -180 y 180').toFloat(),

  query('lat').custom((_value, { req }) => {
    const hasLat = req.query?.lat !== undefined;
    const hasLng = req.query?.lng !== undefined;
    if (hasLat !== hasLng) {
      throw new Error('lat y lng deben enviarse juntos');
    }
    return true;
  })
];

export const getMatchesValidator = [
  query('radiusKm')
    .optional()
    .isInt({ min: 5, max: 200 })
    .withMessage('radiusKm debe ser un entero entre 5 y 200')
    .toInt(),

  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit debe ser un entero entre 1 y 50').toInt()
];
