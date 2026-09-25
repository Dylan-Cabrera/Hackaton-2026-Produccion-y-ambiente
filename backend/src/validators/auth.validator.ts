import { body } from 'express-validator';
import { ACCOUNT_TYPES } from '../constants/user.constants.js';
import { CATEGORIES, INSTITUTION_TYPES } from '../constants/catalog.constants.js';
import { LOCALITY_NAMES } from '../constants/localities.constants.js';
import { coordinatesValidator, stringArrayValidator } from './common.validators.js';

export const registerValidator = [
  // ADMIN no se puede registrar por esta vía
  body('role').isIn(['CONSUMER', 'PRODUCER']).withMessage('El rol debe ser CONSUMER o PRODUCER'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede superar los 100 caracteres'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es obligatorio')
    .isEmail()
    .withMessage('Debe ingresar un email válido')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),

  // --- CONSUMER ---
  body('accountType')
    .if(body('role').equals('CONSUMER'))
    .isIn(ACCOUNT_TYPES)
    .withMessage(`accountType es obligatorio para consumidores y debe ser una de: ${ACCOUNT_TYPES.join(', ')}`),

  body('organizationName')
    .if(body('accountType').equals('INSTITUCION'))
    .trim()
    .notEmpty()
    .withMessage('El nombre de la organización es obligatorio para instituciones')
    .isLength({ max: 120 })
    .withMessage('El nombre de la organización no puede superar los 120 caracteres'),

  body('institutionType')
    .if(body('accountType').equals('INSTITUCION'))
    .isIn(INSTITUTION_TYPES)
    .withMessage(`institutionType es obligatorio para instituciones y debe ser uno de: ${INSTITUTION_TYPES.join(', ')}`),

  body('phone')
    .if(body('role').equals('CONSUMER'))
    .optional()
    .customSanitizer((value) => String(value).replace(/\D/g, ''))
    .matches(/^\d{10,15}$/)
    .withMessage('El teléfono debe incluir código de país y área (ej: 5493704123456)'),

  body('locality')
    .if(body('role').equals('CONSUMER'))
    .optional()
    .isIn(LOCALITY_NAMES)
    .withMessage(`La localidad debe ser una de: ${LOCALITY_NAMES.join(', ')}`),

  // --- PRODUCER ---
  body('phone')
    .if(body('role').equals('PRODUCER'))
    .notEmpty()
    .withMessage('El teléfono es obligatorio para productores')
    .customSanitizer((value) => String(value).replace(/\D/g, ''))
    .matches(/^\d{10,15}$/)
    .withMessage('El teléfono debe incluir código de país y área (ej: 5493704123456)'),

  body('locality')
    .if(body('role').equals('PRODUCER'))
    .isIn(LOCALITY_NAMES)
    .withMessage(`La localidad es obligatoria para productores y debe ser una de: ${LOCALITY_NAMES.join(', ')}`),

  body('businessName')
    .if(body('role').equals('PRODUCER'))
    .trim()
    .notEmpty()
    .withMessage('El nombre comercial es obligatorio para productores')
    .isLength({ max: 100 })
    .withMessage('El nombre comercial no puede superar los 100 caracteres'),

  body('category')
    .if(body('role').equals('PRODUCER'))
    .isIn(CATEGORIES)
    .withMessage(`La categoría es obligatoria para productores y debe ser una de: ${CATEGORIES.join(', ')}`),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La dirección no puede superar los 255 caracteres'),

  coordinatesValidator('coordinates'),

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

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es obligatorio')
    .isEmail()
    .withMessage('Debe ingresar un email válido')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
];
