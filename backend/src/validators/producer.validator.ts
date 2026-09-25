import { body, param } from 'express-validator';
import { CATEGORIES } from '../constants/catalog.constants.js';
import { LOCALITY_NAMES } from '../constants/localities.constants.js';
import { coordinatesValidator, stringArrayValidator } from './common.validators.js';

// PUT /api/producers/profile: campos del emprendimiento + campos de cuenta que
// se editan en la misma transacción. Todos opcionales (edición parcial).
export const updateProducerProfileValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede superar los 100 caracteres'),

  body('phone')
    .optional()
    .customSanitizer((value) => String(value).replace(/\D/g, ''))
    .matches(/^\d{10,15}$/)
    .withMessage('El teléfono debe incluir código de país y área (ej: 5493704123456)'),

  body('locality')
    .optional()
    .isIn(LOCALITY_NAMES)
    .withMessage(`La localidad debe ser una de: ${LOCALITY_NAMES.join(', ')}`),

  coordinatesValidator('coordinates'),

  body('businessName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre comercial no puede estar vacío')
    .isLength({ max: 100 })
    .withMessage('El nombre comercial no puede superar los 100 caracteres'),

  body('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`La categoría debe ser una de: ${CATEGORIES.join(', ')}`),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La dirección no puede superar los 255 caracteres'),

  ...stringArrayValidator('paymentMethods', 'Métodos de pago'),
  ...stringArrayValidator('deliveryOptions', 'Opciones de entrega'),

  body('bio')
    .optional({ values: 'null' })
    .isString()
    .withMessage('La bio debe ser un texto')
    .trim()
    .isLength({ max: 500 })
    .withMessage('La bio no puede superar los 500 caracteres')
];

export const producerIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('El id debe ser un número entero positivo').toInt()
];
