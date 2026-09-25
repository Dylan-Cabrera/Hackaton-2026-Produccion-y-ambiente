import { body } from 'express-validator';
import { INSTITUTION_TYPES } from '../constants/catalog.constants.js';
import { LOCALITY_NAMES } from '../constants/localities.constants.js';
import { coordinatesValidator } from './common.validators.js';

export const updateUserValidator = [
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

  body('organizationName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre de la organización no puede estar vacío')
    .isLength({ max: 120 })
    .withMessage('El nombre de la organización no puede superar los 120 caracteres'),

  body('institutionType')
    .optional()
    .isIn(INSTITUTION_TYPES)
    .withMessage(`institutionType debe ser uno de: ${INSTITUTION_TYPES.join(', ')}`)
];
