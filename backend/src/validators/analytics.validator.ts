import { query } from 'express-validator';

export const producerDemandValidator = [
  query('days').optional().isIn(['7', '30', '90']).withMessage('days debe ser 7, 30 o 90').toInt()
];
