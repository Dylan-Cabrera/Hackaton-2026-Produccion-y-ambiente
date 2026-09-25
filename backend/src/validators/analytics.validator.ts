import { query } from 'express-validator';
import { CATEGORIES } from '../constants/catalog.constants.js';

const daysValidator = query('days').optional().isIn(['7', '30', '90']).withMessage('days debe ser 7, 30 o 90').toInt();

export const producerDemandValidator = [daysValidator];

export const adminSummaryValidator = [daysValidator];

export const demandHeatValidator = [
  daysValidator,
  query('category').optional().isIn(CATEGORIES).withMessage('category no es válida')
];

export const unmetDemandMapValidator = [
  daysValidator,
  query('category').optional().isIn(CATEGORIES).withMessage('category no es válida')
];

export const trendsValidator = [daysValidator];
