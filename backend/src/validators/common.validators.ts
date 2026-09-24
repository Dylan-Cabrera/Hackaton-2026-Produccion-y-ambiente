import { body } from 'express-validator';

// [longitud, latitud], reutilizado por auth/user/producer validators
export const coordinatesValidator = (field: string) =>
  body(field)
    .optional()
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
    .customSanitizer((value: unknown[]) => value.map(Number));

export const stringArrayValidator = (field: string, label: string) => [
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
