import { body, param } from 'express-validator';
import { PRODUCER_CATEGORIES } from '../constants/producer.constants.js';

const stringArray = (field: string, label: string) => [
  body(field)
    .optional()
    .isArray()
    .withMessage(`${label} debe ser un arreglo`),

  body(`${field}.*`)
    .isString()
    .trim()
    .notEmpty()
    .withMessage(`Cada elemento de ${label.toLowerCase()} debe ser un texto no vacío`)
];

export const registerProducerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede superar los 100 caracteres'),

  body('businessName')
    .trim()
    .notEmpty()
    .withMessage('El nombre comercial es obligatorio')
    .isLength({ max: 100 })
    .withMessage('El nombre comercial no puede superar los 100 caracteres'),

  body('category')
    .isIn(PRODUCER_CATEGORIES)
    .withMessage(`La categoría debe ser una de: ${PRODUCER_CATEGORIES.join(', ')}`),

  body('phone')
    .notEmpty()
    .withMessage('El teléfono es obligatorio')
    // Normaliza a solo dígitos (quita +, espacios y guiones)
    .customSanitizer((value) => String(value).replace(/\D/g, ''))
    .matches(/^\d{10,15}$/)
    .withMessage('El teléfono debe incluir código de país y área (ej: 5493704123456)'),

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

  body('location')
    .isObject()
    .withMessage('La ubicación es obligatoria: { address, coordinates: [lng, lat] }'),

  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('La dirección es obligatoria')
    .isLength({ max: 255 })
    .withMessage('La dirección no puede superar los 255 caracteres'),

  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Las coordenadas deben ser [longitud, latitud]')
    .bail()
    .custom(([lng, lat]) => {
      const lngNum = Number(lng);
      const latNum = Number(lat);
      if (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180) {
        throw new Error('La longitud debe ser un número entre -180 y 180');
      }
      if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
        throw new Error('La latitud debe ser un número entre -90 y 90');
      }
      return true;
    })
    .customSanitizer((value: unknown[]) => value.map(Number)),

  ...stringArray('paymentMethods', 'Métodos de pago'),
  ...stringArray('deliveryOptions', 'Opciones de entrega'),

  body('bio')
    .optional({ values: 'null' })
    .isString()
    .withMessage('La bio debe ser un texto')
    .trim()
    .isLength({ max: 500 })
    .withMessage('La bio no puede superar los 500 caracteres')
];

export const updateProducerValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede superar los 100 caracteres'),

  body('businessName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre comercial no puede estar vacío')
    .isLength({ max: 100 })
    .withMessage('El nombre comercial no puede superar los 100 caracteres'),

  body('category')
    .optional()
    .isIn(PRODUCER_CATEGORIES)
    .withMessage(`La categoría debe ser una de: ${PRODUCER_CATEGORIES.join(', ')}`),

  body('phone')
    .optional()
    .notEmpty()
    .withMessage('El teléfono no puede estar vacío')
    .customSanitizer((value) => String(value).replace(/\D/g, ''))
    .matches(/^\d{10,15}$/)
    .withMessage('El teléfono debe incluir código de país y área (ej: 5493704123456)'),

  body('location')
    .optional()
    .isObject()
    .withMessage('La ubicación debe ser un objeto: { address, coordinates: [lng, lat] }'),

  body('location.address')
    .if(body('location').exists())
    .trim()
    .notEmpty()
    .withMessage('La dirección es obligatoria')
    .isLength({ max: 255 })
    .withMessage('La dirección no puede superar los 255 caracteres'),

  body('location.coordinates')
    .if(body('location').exists())
    .isArray({ min: 2, max: 2 })
    .withMessage('Las coordenadas deben ser [longitud, latitud]')
    .bail()
    .custom(([lng, lat]) => {
      const lngNum = Number(lng);
      const latNum = Number(lat);
      if (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180) {
        throw new Error('La longitud debe ser un número entre -180 y 180');
      }
      if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
        throw new Error('La latitud debe ser un número entre -90 y 90');
      }
      return true;
    })
    .customSanitizer((value: unknown[]) => value.map(Number)),

  ...stringArray('paymentMethods', 'Métodos de pago'),
  ...stringArray('deliveryOptions', 'Opciones de entrega'),

  body('bio')
    .optional({ values: 'null' })
    .isString()
    .withMessage('La bio debe ser un texto')
    .trim()
    .isLength({ max: 500 })
    .withMessage('La bio no puede superar los 500 caracteres')
];

export const producerIdValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El id debe ser un número entero positivo')
    .toInt()
];
