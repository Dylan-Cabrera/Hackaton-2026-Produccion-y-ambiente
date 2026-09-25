import { body } from 'express-validator';
import { EVENT_TYPES, PRODUCT_EVENT_TYPES } from '../constants/telemetry.constants.js';
import { CATEGORIES } from '../constants/catalog.constants.js';
import { LOCALITY_NAMES } from '../constants/localities.constants.js';

export const telemetryEventValidator = [
  body('eventType').isIn(EVENT_TYPES).withMessage(`eventType debe ser uno de: ${EVENT_TYPES.join(', ')}`),

  body('queryTerm')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('queryTerm debe tener entre 2 y 80 caracteres'),

  body('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`category debe ser una de: ${CATEGORIES.join(', ')}`),

  // SEARCH_HIT / SEARCH_FAIL requieren queryTerm o category
  body().custom((_value, { req }) => {
    const { eventType, queryTerm, category } = req.body ?? {};
    if ((eventType === 'SEARCH_HIT' || eventType === 'SEARCH_FAIL') && !queryTerm && !category) {
      throw new Error('SEARCH_HIT/SEARCH_FAIL requieren queryTerm o category');
    }
    return true;
  }),

  body('producerId')
    .if(body('eventType').equals('WHATSAPP_CLICK'))
    .isInt({ min: 1 })
    .withMessage('producerId es obligatorio para WHATSAPP_CLICK')
    .toInt(),

  body('productId').optional().isInt({ min: 1 }).withMessage('productId debe ser un entero positivo').toInt(),

  // WHATSAPP_CLICK y PRODUCT_VIEW requieren productId (needId, alternativo, llega con HU-11)
  body().custom((_value, { req }) => {
    const { eventType, productId } = req.body ?? {};
    if (PRODUCT_EVENT_TYPES.includes(eventType) && !productId) {
      throw new Error(`${eventType} requiere productId`);
    }
    return true;
  }),

  body('locality')
    .optional()
    .isIn(LOCALITY_NAMES)
    .withMessage(`locality debe ser una de: ${LOCALITY_NAMES.join(', ')}`),

  body('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('lat debe ser un número entre -90 y 90')
    .toFloat(),

  body('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('lng debe ser un número entre -180 y 180')
    .toFloat(),

  // lat y lng, si vienen, tienen que venir juntos
  body().custom((_value, { req }) => {
    const hasLat = req.body?.lat !== undefined;
    const hasLng = req.body?.lng !== undefined;
    if (hasLat !== hasLng) {
      throw new Error('lat y lng deben enviarse juntos');
    }
    return true;
  })
];
